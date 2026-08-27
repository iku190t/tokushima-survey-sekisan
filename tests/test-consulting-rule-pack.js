"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "consulting-rule-pack.json"), "utf8"));
const engine = require(path.join(root, "consulting-engine.js"));
const conditionSource = fs.readFileSync(path.join(root, "data", "consulting-condition-rules.js"), "utf8");
const conditionWindow = {};
Function("window", conditionSource)(conditionWindow);
const conditionRules = conditionWindow.CONSULTING_CONDITION_RULES;

assert.deepStrictEqual(data.supportedYears, [2026, 2025, 2024], "令和6～8年度を収録する");
assert.strictEqual(data.rules.length, 1393, "照合済み歩掛行を1,393件収録する");
assert.strictEqual(new Set(data.rules.map((rule) => rule.id)).size, data.rules.length, "歩掛IDは重複しない");
assert.deepStrictEqual(Object.fromEntries(data.audits.map((entry) => [entry.fiscalYear, entry.ruleCount])), { 2024: 461, 2025: 462, 2026: 470 }, "年度別歩掛数を固定する");
assert.ok(data.rules.every((rule) => ["high", "medium"].includes(rule.source?.confidence)), "全歩掛を国交省対応ページへ高・中確度で照合する");
assert.ok(data.rules.every((rule) => /^https:\/\/www\.mlit\.go\.jp\//.test(rule.source?.url || "") && Number.isInteger(rule.source?.page)), "全歩掛に国交省PDFとページ番号を持たせる");
assert.ok(data.rules.every((rule) => rule.verificationStatus === "source-table-crosschecked"), "未照合歩掛を実行対象へ混ぜない");

const validRoles = new Set([
  "designPrincipal", "designDirector", "designLead", "designEngineerA", "designEngineerB", "designEngineerC", "designTechnician",
  "surveyChief", "surveyEngineer", "surveyAssistantEngineer", "surveyAssistant", "surveyWorker",
  "geologyEngineer", "geologyChiefOperator", "geologyOperator"
]);
for (const rule of data.rules) {
  assert.ok(rule.label && rule.standardUnit && Object.keys(rule.roles).length, `表示・標準単位・人工が揃う: ${rule.id}`);
  assert.ok(["design", "survey", "geology"].includes(rule.costSystem), `経費体系が明示される: ${rule.id}`);
  assert.ok(Object.keys(rule.roles).every((role) => validRoles.has(role)), `職種コードが正しい: ${rule.id}`);
  assert.ok(Object.values(rule.roles).every((days) => Number.isFinite(days) && days > 0), `人工が正数: ${rule.id}`);
  assert.ok(Array.isArray(rule.quantitySpec) && rule.quantitySpec.length, `入力桁規則を明示する: ${rule.id}`);
  assert.ok(rule.quantitySpec.every((dimension) => dimension.status === "audited-2026-08-24" && [0, 3].includes(dimension.decimals)), `整数・小数桁を監査済みにする: ${rule.id}`);
  const spec = engine.parseStandardQuantity(rule.standardUnit, rule.quantitySpec);
  const values = Object.fromEntries(spec.dimensions.map((dimension) => [dimension.key, dimension.baseQuantity]));
  assert.strictEqual(engine.calculateStandardQuantity(rule.standardUnit, values, rule.quantitySpec).multiplier, 1, `標準数量が1倍になる: ${rule.id}`);
}

for (const year of [2024, 2025, 2026]) {
  const rules = data.rules.filter((rule) => rule.fiscalYear === year);
  assert.ok(rules.some((rule) => rule.costSystem === "survey" && Object.keys(rule.roles).some((role) => role.startsWith("survey"))), `${year}年度の水文等を測量方式で区別する`);
  assert.ok(rules.some((rule) => rule.serviceType === "geologyGeneral" && rule.costSystem === "geology"), `${year}年度の地質一般を地質方式で区別する`);
}

const supportedCounts = {
  2024: { design: 313, planning: 109, geology: 39 },
  2025: { design: 313, planning: 109, geology: 40 },
  2026: { design: 313, planning: 117, geology: 40 }
};
for (const [yearText, expected] of Object.entries(supportedCounts)) {
  const year = Number(yearText);
  for (const [scope, expectedCount] of Object.entries(expected)) {
    const serviceTypes = scope === "geology" ? ["geologyAnalysis", "geologyGeneral"] : [scope];
    const rules = data.rules.filter((rule) => rule.fiscalYear === year && serviceTypes.includes(rule.serviceType));
    const calculable = rules.filter((rule) => {
      const family = data.families.find((entry) => entry.fiscalYear === year && entry.serviceType === rule.serviceType && entry.familyCode === rule.familyCode);
      const conditionRule = engine.findConditionRule(rule, conditionRules, year);
      return engine.classifyPresetCoverage(rule, conditionRule, family).canCalculate;
    });
    assert.strictEqual(rules.length, expectedCount, `${year}年度${scope}の収録件数を固定する`);
    assert.strictEqual(calculable.length, expectedCount, `${year}年度${scope}の原表照合済み全項目を計算入力可能にする`);
  }
}

const r8Families = data.families.filter((family) => family.fiscalYear === 2026);
assert.ok(r8Families.some((family) => family.parameterTables.length), "補正・規格・日当たり作業量表を構造化する");
assert.ok(r8Families.some((family) => family.formulas.length), "数量式・補正式を構造化する");
assert.ok(r8Families.some((family) => family.adjustments.length), "加算・控除条件を構造化する");

console.log("OK: R6-R8 MLIT-crosschecked consulting rule pack");
