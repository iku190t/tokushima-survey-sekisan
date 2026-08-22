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
assert.deepStrictEqual(JSON.parse(JSON.stringify(authorities.find((entry) => entry.code === "mlit"))), { code: "mlit", name: "国土交通省（直轄）", type: "national" });

const catalog = JSON.parse(fs.readFileSync(path.join(root, "data", "master-catalog.json"), "utf8"));
assert.strictEqual(catalog.schemaVersion, 1);
assert.ok(Array.isArray(catalog.masters) && catalog.masters.length > 0, "配信カタログにマスターがある");
for (const entry of catalog.masters) {
  assert.strictEqual(entry.verificationStatus, "verified", `${entry.id} は検証済みだけを配信する`);
  assert.ok(authorities.some((region) => region.code === entry.jurisdictionCode && region.name === entry.jurisdictionName), `${entry.id} の発注機関が一覧と一致する`);
  const raw = fs.readFileSync(path.join(root, entry.path));
  assert.strictEqual(crypto.createHash("sha256").update(raw).digest("hex"), entry.sha256, `${entry.id} のSHA-256が一致する`);
  const master = JSON.parse(raw.toString("utf8"));
  assert.strictEqual(master.id, entry.id);
  assert.strictEqual(master.masterVersion, entry.version);
  assert.strictEqual(master.jurisdictionCode, entry.jurisdictionCode);
  assert.strictEqual(master.fiscalYear, entry.fiscalYear);
  assert.strictEqual(master.verificationStatus, "verified");
}
assert.ok(catalog.masters.every((entry) => entry.verificationStatus !== "standard-reference"), "全国標準参考を県版検証済み配信カタログへ混入させない");

const hiroshimaCatalog = catalog.masters.filter((entry) => entry.jurisdictionCode === "34");
assert.deepStrictEqual(hiroshimaCatalog.map((entry) => entry.fiscalYear).sort(), [2024, 2025, 2026], "広島県は令和6・7・8年度の完全マスターを配信する");
const bundledContext = { window: {} };
vm.createContext(bundledContext);
vm.runInContext(fs.readFileSync(path.join(root, "data", "verified-masters.js"), "utf8"), bundledContext);
const bundledMasters = JSON.parse(JSON.stringify(bundledContext.window.SEKISAN_VERIFIED_MASTERS));
assert.deepStrictEqual(bundledMasters.map((master) => master.id).sort(), hiroshimaCatalog.map((entry) => entry.id).sort(), "ローカル版の初期収録と配信カタログが一致する");
for (const bundled of bundledMasters) {
  const catalogEntry = hiroshimaCatalog.find((entry) => entry.id === bundled.id);
  const fileMaster = JSON.parse(fs.readFileSync(path.join(root, catalogEntry.path), "utf8"));
  assert.deepStrictEqual(bundled, fileMaster, `${bundled.id} のローカル初期収録値が配信JSONと一致する`);
}

const sourceCatalog = JSON.parse(fs.readFileSync(path.join(root, "data", "official-source-catalog.json"), "utf8"));
assert.strictEqual(sourceCatalog.schemaVersion, 1);
assert.strictEqual(new Set(sourceCatalog.sources.map((entry) => entry.id)).size, sourceCatalog.sources.length, "公式原資料IDが重複しない");
for (const year of [2024, 2025, 2026]) {
  const hiroshima = sourceCatalog.sources.filter((entry) => entry.jurisdictionCode === "34" && entry.fiscalYear === year);
  assert.deepStrictEqual(new Set(hiroshima.map((entry) => entry.kind)), new Set(["standard", "reference"]), `広島県${year}年度の基準書本体と参考資料を取得済み`);
  assert.ok(hiroshima.every((entry) => entry.acquisitionStatus === "acquired" && /^https:\/\//.test(entry.url) && /^[0-9a-f]{64}$/.test(entry.sha256)), `広島県${year}年度原資料の取得証跡が完全`);
  assert.ok(sourceCatalog.sources.some((entry) => entry.jurisdictionCode === "mlit" && entry.fiscalYear === year && entry.kind === "role-prices"), `国交省${year}年度技術者単価原本を取得済み`);
}

console.log("OK: nationwide jurisdiction and verified master catalog checks passed");
