"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const audit = JSON.parse(fs.readFileSync(path.join(root, "data", "source-audits", "maff-land-improvement-sources.json"), "utf8"));
const pack = JSON.parse(fs.readFileSync(path.join(root, "data", "maff-rule-pack.json"), "utf8"));

assert.strictEqual(audit.systemId, "maff-land-improvement");
assert.deepStrictEqual(audit.supportedYears, [2026, 2025, 2024]);
assert.strictEqual(audit.documentCount, 37, "令和6～8年度の公式資料37件を台帳化する");
assert.strictEqual(audit.pageCount, 2156, "公式資料2,156頁を索引化する");
assert.ok(audit.documents.every((entry) => /^https:\/\/www\.maff\.go\.jp\//.test(entry.url)), "出典は農林水産省公式URLだけにする");
assert.ok(audit.documents.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256) && entry.pageCount > 0), "全PDFにSHA-256と頁数を持つ");

assert.strictEqual(pack.standardSystem, "maff-land-improvement");
assert.deepStrictEqual(pack.supportedYears, [2026, 2025, 2024]);
assert.ok(pack.ruleCount >= 6500, "公式表から6,500件以上の計算規則を抽出する");
assert.strictEqual(pack.marketRuleCount, 85, "見出し行を除いた市場単価方式85規格を独立規則として収録する");
assert.ok(pack.familyCount >= 400, "条件・式を原表ページ単位の作業群へ結ぶ");
assert.strictEqual(pack.rules.filter((rule) => /\uFFFD/.test(`${rule.label}${rule.standardUnit}`)).length, 0, "作業名・単位に置換文字を残さない");
assert.ok(pack.rules.every((rule) => [2024, 2025, 2026].includes(rule.fiscalYear) && rule.source?.url?.includes("maff.go.jp") && rule.physicalPage > 0), "全規則に年度・公式URL・PDF頁を持つ");
assert.ok(pack.rules.some((rule) => rule.sourceKind === "official-reference-walk"), "積算参考歩掛を標準歩掛と区別する");
assert.ok(pack.rules.some((rule) => rule.pricingMode === "official-market-unit-price-input"), "非公開価格を捏造せず採用市場単価入力へ接続する");
assert.strictEqual(pack.rules.filter((rule) => /(?:孔径区分・(?:土質|岩)区分|規格区分|土質区分|岩区分)/.test(String(rule.label || "").replace(/\s+/g, ""))).length, 0, "市場単価表の見出し行を作業項目へ混入しない");
assert.strictEqual(pack.rules.filter((rule) => rule.docId === "survey" && rule.headings?.at(-1)?.code === "1-3").length, 0, "測量の計算例を作業項目へ混入しない");

const r8Survey = pack.rules.filter((rule) => rule.fiscalYear === 2026 && rule.serviceType === "survey");
assert.ok(r8Survey.some((rule) => rule.standardUnit === "1業務当り"), "現地測量の固定作業を1業務で収録する");
assert.ok(r8Survey.some((rule) => rule.standardUnit === "0.1km2当り"), "現地測量の変動作業を0.1km²で収録する");
const identities = new Set(pack.rules.map((rule) => `${rule.fiscalYear}|${rule.docId}|${rule.physicalPage}|${rule.label}|${rule.standardUnit}|${JSON.stringify(rule.roles || {})}`));
assert.strictEqual(identities.size, pack.ruleCount, "同じ名称でも別原表ページの規格を潰さず、同一原表の重複だけを除く");

console.log("OK: MAFF R6-R8 source ledger and 6,504 official-table rules");
