"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "prefectures.js"), "utf8"), context);
const prefectures = context.window.SEKISAN_PREFECTURES;
const authorities = context.window.SEKISAN_JURISDICTIONS;
assert.strictEqual(prefectures.length, 47, "47都道府県を収録する");
assert.strictEqual(authorities.length, 48, "国土交通省と47都道府県を収録する");
assert.strictEqual(new Set(authorities.map((entry) => entry.code)).size, 48, "発注機関コードが重複しない");
assert.deepStrictEqual(JSON.parse(JSON.stringify(prefectures.find((entry) => entry.code === "36"))), { code: "36", name: "徳島県" });
assert.deepStrictEqual(JSON.parse(JSON.stringify(authorities.find((entry) => entry.code === "mlit"))), { code: "mlit", name: "国土交通省（全国標準）", type: "national" });

const catalog = JSON.parse(fs.readFileSync(path.join(root, "data", "master-catalog.json"), "utf8"));
assert.strictEqual(catalog.schemaVersion, 1);
assert.ok(Array.isArray(catalog.masters) && catalog.masters.length > 0, "配信カタログにマスターがある");
for (const entry of catalog.masters) {
  assert.strictEqual(entry.jurisdictionCode, "mlit", `${entry.id} は全国標準だけを配信する`);
  assert.strictEqual(entry.verificationStatus, "standard-reference", `${entry.id} は全国標準の検証状態を保持する`);
  assert.ok(authorities.some((region) => region.code === entry.jurisdictionCode && region.name === entry.jurisdictionName), `${entry.id} の発注機関が一覧と一致する`);
  const raw = fs.readFileSync(path.join(root, entry.path));
  assert.strictEqual(crypto.createHash("sha256").update(raw).digest("hex"), entry.sha256, `${entry.id} のSHA-256が一致する`);
  const master = JSON.parse(raw.toString("utf8"));
  assert.strictEqual(master.id, entry.id);
  assert.strictEqual(master.masterVersion, entry.version);
  assert.strictEqual(master.jurisdictionCode, entry.jurisdictionCode);
  assert.strictEqual(master.fiscalYear, entry.fiscalYear);
  assert.strictEqual(master.verificationStatus, "standard-reference");
}
assert.deepStrictEqual(catalog.masters.map((entry) => entry.fiscalYear).sort(), [2024, 2025, 2026], "全国標準は令和6・7・8年度を配信する");
assert.ok(catalog.masters.every((entry) => !entry.path.includes("tokushima") && !entry.path.includes("hiroshima")), "県別マスターを通常配信カタログへ混入させない");

const sourceCatalog = JSON.parse(fs.readFileSync(path.join(root, "data", "official-source-catalog.json"), "utf8"));
assert.strictEqual(sourceCatalog.schemaVersion, 1);
assert.strictEqual(new Set(sourceCatalog.sources.map((entry) => entry.id)).size, sourceCatalog.sources.length, "公式原資料IDが重複しない");
for (const year of [2024, 2025, 2026]) {
  const hiroshima = sourceCatalog.sources.filter((entry) => entry.jurisdictionCode === "34" && entry.fiscalYear === year);
  assert.deepStrictEqual(new Set(hiroshima.map((entry) => entry.kind)), new Set(["standard", "reference"]), `広島県${year}年度の基準書本体と参考資料を取得済み`);
  assert.ok(hiroshima.every((entry) => entry.acquisitionStatus === "acquired" && /^https:\/\//.test(entry.url) && /^[0-9a-f]{64}$/.test(entry.sha256)), `広島県${year}年度原資料の取得証跡が完全`);
  assert.ok(sourceCatalog.sources.some((entry) => entry.jurisdictionCode === "mlit" && entry.fiscalYear === year && entry.kind === "role-prices"), `国交省${year}年度技術者単価原本を取得済み`);
}
for (const kind of ["base-measurement-standard", "base-geology-standard", "base-design-standard", "base-planning-standard", "base-reference-general", "base-reference-measurement", "base-reference-geology", "base-reference-design", "reference-amendment-general"]) {
  const source = sourceCatalog.sources.find((entry) => entry.jurisdictionCode === "mlit" && entry.kind === kind);
  assert.ok(source && source.acquisitionStatus === "acquired" && source.pages > 0 && /^[0-9a-f]{64}$/.test(source.sha256), `国交省の基準書本体・参考資料 ${kind} を取得・索引済み`);
}
const linkAudit = JSON.parse(fs.readFileSync(path.join(root, "data", "source-audits", "mlit-gyoumu-sekisan-links.json"), "utf8"));
assert.deepStrictEqual({ all: linkAudit.allLinkCount, pdf: linkAudit.pdfLinkCount, uniquePdf: linkAudit.uniquePdfLinkCount }, { all: 171, pdf: 155, uniquePdf: 152 }, "国交省掲載ページの全リンクを重複込みで目録化");
assert.strictEqual(linkAudit.pdfLinks.length, 152, "国交省PDFリンク目録を全件保持する");
const documentAudit = JSON.parse(fs.readFileSync(path.join(root, "data", "source-audits", "mlit-gyoumu-sekisan-documents.json"), "utf8"));
assert.deepStrictEqual({ unique: documentAudit.uniquePdfLinkCount, acquired: documentAudit.acquiredCount, failed: documentAudit.failedCount }, { unique: 152, acquired: 152, failed: 0 }, "国交省掲載PDFを全件取得・索引する");
assert.deepStrictEqual({ pages: documentAudit.totalPages, bytes: documentAudit.totalBytes }, { pages: 3054, bytes: 176433922 }, "国交省掲載PDF152件の合計ページ数と取得容量を記録する");
assert.ok(documentAudit.documents.every((entry) => entry.status === "acquired" && entry.pages > 0 && entry.bytes > 0 && /^[0-9a-f]{64}$/.test(entry.sha256)), "国交省全PDFのページ数・容量・SHA-256を保持する");

console.log("OK: nationwide submission destinations and standard master catalog checks passed");
