"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "consulting-standard-walks.json"), "utf8"));
const sourceCatalog = JSON.parse(fs.readFileSync(path.join(root, "data", "official-source-catalog.json"), "utf8"));
const engine = require(path.join(root, "consulting-engine.js"));

assert.deepStrictEqual(data.supportedYears, [2026, 2025, 2024], "令和6～8年度を収録する");
assert.strictEqual(data.presets.length, 735, "年度別の職種別標準歩掛735表を収録する");
assert.strictEqual(new Set(data.presets.map((preset) => preset.id)).size, data.presets.length, "歩掛IDは重複しない");

const serviceRoles = {
  design: new Set(["designPrincipal", "designDirector", "designLead", "designEngineerA", "designEngineerB", "designEngineerC", "designTechnician"]),
  planning: new Set(["designPrincipal", "designDirector", "designLead", "designEngineerA", "designEngineerB", "designEngineerC", "designTechnician"]),
  geologyAnalysis: new Set(["designPrincipal", "designDirector", "designLead", "designEngineerA", "designEngineerB", "designEngineerC", "designTechnician"]),
  geologyGeneral: new Set(["geologyEngineer", "geologyChiefOperator", "geologyOperator"])
};

for (const preset of data.presets) {
  assert.ok(serviceRoles[preset.serviceType], `業務区分が正しい: ${preset.id}`);
  assert.ok([2024, 2025, 2026].includes(preset.fiscalYear), `年度が正しい: ${preset.id}`);
  assert.ok(preset.label && preset.standardUnit && preset.source, `全国標準参考の表示情報が揃う: ${preset.id}`);
  assert.strictEqual(preset.sourcePage, null, `県版全編のページ番号を流用しない: ${preset.id}`);
  assert.strictEqual(preset.verificationStatus, "national-reference", `全国標準参考として区別する: ${preset.id}`);
  assert.strictEqual(preset.sourceUrl, "https://www.mlit.go.jp/tec/gyoumu_sekisan.html", `国交省年度別ページを照合先にする: ${preset.id}`);
  const quantityRule = engine.parseStandardQuantity(preset.standardUnit);
  assert.ok(quantityRule.dimensions.length >= 1, `標準単位を数量欄へ変換できる: ${preset.id}/${preset.standardUnit}`);
  const standardValues = Object.fromEntries(quantityRule.dimensions.map((dimension) => [dimension.key, dimension.baseQuantity]));
  const standardCalculation = engine.calculateStandardQuantity(preset.standardUnit, standardValues);
  assert.ok(standardCalculation.valid, `標準数量で計算できる: ${preset.id}/${preset.standardUnit}`);
  assert.strictEqual(standardCalculation.multiplier, 1, `標準数量は倍率1になる: ${preset.id}/${preset.standardUnit}`);
  for (const [role, days] of Object.entries(preset.roles)) {
    assert.ok(serviceRoles[preset.serviceType].has(role), `職種が業務区分に合う: ${preset.id}/${role}`);
    assert.ok(Number.isFinite(days) && days > 0, `人工が正数: ${preset.id}/${role}`);
  }
}

const counts = Object.fromEntries(data.audits.map((audit) => [audit.fiscalYear, audit.presetCount]));
assert.deepStrictEqual(counts, { 2024: 242, 2025: 243, 2026: 250 }, "年度別表数を固定する");
const coverageCounts = data.presets.reduce((countsByStatus, preset) => {
  const status = engine.classifyPresetCoverage(preset).status;
  countsByStatus[status] = (countsByStatus[status] || 0) + 1;
  return countsByStatus;
}, {});
assert.deepStrictEqual(coverageCounts, { "incomplete-rule": 703, "reference-only": 32 }, "全国標準候補を条件未実装703表と参照専用32表へ監査分類する");
for (const year of [2024, 2025, 2026]) assert.ok(data.presets.some((preset) => preset.fiscalYear === year && engine.classifyPresetCoverage(preset).status === "reference-only"), `${year}年度の編成人員等を参照専用にする`);

const road = data.presets.find((preset) => preset.fiscalYear === 2026 && preset.label === "2-3-1 道路詳細設計（A）");
assert.ok(road, "令和8年度道路詳細設計Aを収録する");
assert.strictEqual(road.standardUnit, "1km当り", "道路詳細設計Aの標準単位");
assert.deepStrictEqual(road.roles, { designDirector: 0.2, designLead: 2.9, designEngineerA: 9.8, designEngineerB: 20.8, designEngineerC: 28.2, designTechnician: 28.2 }, "道路詳細設計Aの合計人工");

const ground = data.presets.find((preset) => preset.fiscalYear === 2026 && preset.label.startsWith("5-5-1 地盤特性検討"));
assert.deepStrictEqual(ground.roles, { designLead: 1, designEngineerA: 1, designEngineerB: 0.5, designEngineerC: 1, designTechnician: 1.5 }, "地盤特性検討の職種別人工");

for (const year of [2024, 2025, 2026]) {
  const official = sourceCatalog.sources.filter((source) => source.jurisdictionCode === "mlit" && source.fiscalYear === year && !String(source.kind).startsWith("role"));
  assert.strictEqual(official.length, 8, `${year}年度の国交省掲載8資料を台帳化する`);
  assert.strictEqual(new Set(official.map((source) => source.sha256)).size, 8, `${year}年度資料のSHA-256を個別保持する`);
  assert.ok(official.every((source) => source.acquisitionStatus === "acquired" && source.auditStatus === "indexed"), `${year}年度資料を取得・索引済みにする`);
}

console.log("OK: R6-R8 nationwide reference walks and MLIT-only source catalog checks passed");
