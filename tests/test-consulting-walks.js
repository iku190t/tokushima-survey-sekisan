"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "consulting-standard-walks.json"), "utf8"));
const sourceCatalog = JSON.parse(fs.readFileSync(path.join(root, "data", "official-source-catalog.json"), "utf8"));

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
  assert.ok(preset.label && preset.standardUnit && preset.source && preset.sourcePage > 0, `表示根拠が揃う: ${preset.id}`);
  assert.strictEqual(preset.verificationStatus, "source-table", `公式原表セル由来である: ${preset.id}`);
  for (const [role, days] of Object.entries(preset.roles)) {
    assert.ok(serviceRoles[preset.serviceType].has(role), `職種が業務区分に合う: ${preset.id}/${role}`);
    assert.ok(Number.isFinite(days) && days > 0, `人工が正数: ${preset.id}/${role}`);
  }
}

const counts = Object.fromEntries(data.audits.map((audit) => [audit.fiscalYear, audit.presetCount]));
assert.deepStrictEqual(counts, { 2024: 242, 2025: 243, 2026: 250 }, "年度別表数を固定する");

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

console.log("OK: R6-R8 consulting/planning/geology source-table walks and MLIT source catalog checks passed");
