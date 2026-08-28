"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const surveyEngine = require(path.join(root, "engine.js"));
const consultingEngine = require(path.join(root, "consulting-engine.js"));
const context = {};
context.window = context;
vm.createContext(context);
for (const file of ["data/maff-source-catalog.js", "data/maff-rule-pack.js", "data/maff-master.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
}

assert.strictEqual(context.MAFF_SURVEY_MASTERS.length, 3, "農水省測量マスターをR6～R8で切り替える");
assert.deepStrictEqual(Array.from(context.MAFF_CONSULTING_MASTER.supportedYears), [2026, 2025, 2024]);
assert.strictEqual(context.MAFF_ROLE_PRICES[2026].roles.designPrincipal, 90300, "R8主任技術者基準日額");
assert.strictEqual(context.MAFF_ROLE_PRICES[2026].roles.surveyChief, 61000, "R8測量主任技師基準日額");

for (const master of context.MAFF_SURVEY_MASTERS) {
  assert.strictEqual(master.standardSystem, "maff-land-improvement");
  assert.strictEqual(master.jurisdictionCode, "maff", "農水省マスターを国交省の発注機関コードへ混在させない");
  assert.ok(master.workItems.length >= 20, `${master.fiscalYear}: 測量原表から作業項目を生成する`);
  assert.ok(master.workItems.every((item) => item.source?.standardPage > 0), `${master.fiscalYear}: 全測量項目に出典頁を持つ`);
  assert.ok(master.workItems.some((item) => item.unit === "業務") && master.workItems.some((item) => item.unit === "km2"), `${master.fiscalYear}: 固定作業と面積作業を分ける`);
}

const r8Survey = context.MAFF_SURVEY_MASTERS.find((entry) => entry.fiscalYear === 2026);
assert.deepStrictEqual([r8Survey.overhead.lowerRate, r8Survey.overhead.upperRate, r8Survey.overhead.a, r8Survey.overhead.b], [95.8, 61.4, 288.5, -0.084], "R8測量諸経費率");
const firstClass = r8Survey.workItems.find((item) => /1級基準点測量/.test(item.name));
assert.ok(firstClass && firstClass.unit === "点" && firstClass.precisionRate === 0.10, "1級基準点は点単位・精度管理費10%");
const firstClassResult = surveyEngine.calculateItem({ masterItem: firstClass, quantity: firstClass.standardQuantity, correctionRate: 0 }, r8Survey, {});
const expectedDirect = Object.entries(firstClass.laborDays).reduce((sum, [role, days]) => sum + r8Survey.roles[role].price * days, 0);
const expectedStandardDirect = expectedDirect
  + Math.floor(expectedDirect * firstClass.machineRate)
  + Math.floor(expectedDirect * firstClass.communicationRate)
  + Math.floor(expectedDirect * firstClass.materialRate);
assert.strictEqual(firstClassResult.standardDirect, expectedStandardDirect, "公式職種別人工×年度基準日額へ機械・通信・材料率を加えて標準直接費を計算する");
assert.strictEqual(firstClassResult.directWork, firstClassResult.unitPrice * firstClass.standardQuantity, "有効4桁で丸めた単価×点数を直接作業費にする");
const field = r8Survey.workItems.find((item) => item.unit === "km2" && /現地測量/.test(item.name));
assert.ok(field.quantityFormula?.a === 718.95 && field.correctionRules[0].options.length === 60, "現地測量の数量式と縮尺・地域・地形60区分");

const baseState = () => ({
  fiscalYear: 2026,
  lines: [],
  costs: { designDirectExpenses: 0, surveyPlanningDirectExpenses: 0, geologyDirectNonLabor: 0, geologyIndirect: 0, geologyExcluded: 0 },
  options: { includeSurvey: false, electronicModes: { designPlanning: "none", geology: "none" }, adjustBusinessPrice: false, taxRate: 0.1 }
});
const master = context.MAFF_CONSULTING_MASTER;
const prices = context.MAFF_ROLE_PRICES[2026].roles;
const state = baseState();
state.lines = [
  { id: "d", serviceType: "design", costSystem: "design", role: "designLead", taskName: "設計", days: 1 },
  { id: "g", serviceType: "geologyGeneral", costSystem: "geology", role: "geologyEngineer", taskName: "地質", days: 1 }
];
state.options.electronicModes = { designPlanning: "detailed", geology: "geology" };
const result = consultingEngine.calculateEstimate(state, master, prices, 0);
assert.ok(result.totals.electronic > 0, "農水省実施設計の電子成果品作成費を計算する");
assert.ok(result.totals.geologyElectronic > 0, "農水省地質一般の電子成果品作成費を計算する");

const marketState = baseState();
marketState.lines = [{ id: "m", lineType: "amount", serviceType: "geologyGeneral", costSystem: "geology", taskName: "機械ボーリング", quantity: 12, unit: "m", unitPrice: 15000, correctionFactor: 1.2 }];
const marketResult = consultingEngine.calculateEstimate(marketState, master, prices, 0);
assert.strictEqual(marketResult.lines[0].amount, 216000, "案件採用市場単価×数量×補正係数を計算する");

console.log("OK: MAFF survey/design/planning/geology calculation engine");
