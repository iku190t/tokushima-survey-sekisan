"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const engine = require(path.join(root, "consulting-engine.js"));

function loadBrowserData(file, globalName, sandbox = { window: {} }) {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox);
  return sandbox.window[globalName];
}

const prices = loadBrowserData("data/official-role-prices.js", "OFFICIAL_ROLE_PRICES");
const master = loadBrowserData("data/consulting-master.js", "CONSULTING_MASTER");
const baseState = () => ({
  fiscalYear: 2026,
  lines: [],
  costs: { designDirectExpenses: 0, geologyDirectNonLabor: 0, geologyIndirect: 0, geologyExcluded: 0 },
  options: { includeSurvey: false, electronicMode: "none", adjustBusinessPrice: false, taxRate: 0.1 }
});

assert.deepStrictEqual(Array.from(master.supportedYears), [2026, 2025, 2024], "令和6～8年度を切替可能");
assert.strictEqual(master.designRules.alpha, 0.35, "その他原価率α=35%");
assert.strictEqual(master.designRules.beta, 0.35, "一般管理費等率β=35%");
assert.deepStrictEqual(
  { lower: master.geologyRules.overhead.lowerRate, a: master.geologyRules.overhead.a, b: master.geologyRules.overhead.b, upper: master.geologyRules.overhead.upperRate },
  { lower: 82.5, a: 290.2, b: -0.091, upper: 60.6 },
  "地質一般調査の諸経費率"
);

const design = baseState();
design.lines = [
  { id: "d1", serviceType: "design", taskName: "設計留意書", role: "designLead", days: 0.5 },
  { id: "d2", serviceType: "design", taskName: "設計留意書", role: "designEngineerA", days: 1 }
];
let result = engine.calculateEstimate(design, master, prices[2026].roles, 0);
assert.strictEqual(result.totals.designLabor, 98050, "R8設計留意書の直接人件費");
assert.strictEqual(result.totals.otherCost, 52796, "設計その他原価");
assert.strictEqual(result.totals.designBusinessCost, 150846, "設計業務原価");
assert.strictEqual(result.totals.generalManagement, 81224, "設計一般管理費等");
assert.strictEqual(result.totals.designBusinessPrice, 232070, "設計業務価格");
assert.strictEqual(result.totals.total, 255277, "設計業務税込合計");

const geology = baseState();
geology.lines = [{ id: "g1", serviceType: "geologyGeneral", taskName: "現場管理", role: "geologyEngineer", days: 1 }];
geology.costs.geologyDirectNonLabor = 100000;
geology.costs.geologyIndirect = 200000;
geology.costs.geologyExcluded = 10000;
result = engine.calculateEstimate(geology, master, prices[2026].roles, 0);
assert.strictEqual(result.totals.geologyTarget, 358300, "地質一般の諸経費対象額");
assert.strictEqual(result.totals.geologyOverheadRate, 82.5, "100万円以下の地質諸経費率");
assert.strictEqual(result.totals.geologyOverhead, 295597, "地質諸経費");
assert.strictEqual(result.totals.geologyBusinessPrice, 663897, "対象外費用を加えた地質業務価格");

const combined = baseState();
combined.options.includeSurvey = true;
combined.options.adjustBusinessPrice = true;
combined.lines = design.lines;
result = engine.calculateEstimate(combined, master, prices[2026].roles, 1234567);
assert.strictEqual(result.totals.rawBusinessPrice, 1466637, "測量と設計を税抜で合算");
assert.strictEqual(result.totals.businessPrice, 1466000, "総合業務価格の千円止め");
assert.strictEqual(result.totals.tax, 146600, "合算後に消費税を一度だけ計算");

assert.strictEqual(engine.normalizeDays(1.23456), 1.235, "人工は小数第3位まで");
assert.strictEqual(engine.normalizeCorrectionFactor(1.236), 1.24, "補正係数・変化率は小数第2位まで");
assert.strictEqual(engine.overheadRate(1000001, master.geologyRules.overhead), 82.5, "地質諸経費の中間式は小数1位");
assert.strictEqual(engine.electronicDeliverableCost(98050, master.designRules.electronic.detailed), 54000, "詳細設計の電子成果品作成費");

console.log("OK: consulting/design/geology calculation checks passed");
