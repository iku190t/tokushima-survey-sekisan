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
  costs: { designDirectExpenses: 0, surveyPlanningDirectExpenses: 0, geologyDirectNonLabor: 0, geologyIndirect: 0, geologyExcluded: 0 },
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

const surveyPlanning = baseState();
surveyPlanning.lines = [{ id: "s1", serviceType: "planning", costSystem: "survey", taskName: "水文観測", role: "surveyEngineer", days: 2 }];
result = engine.calculateEstimate(surveyPlanning, master, prices[2026].roles, 0);
assert.strictEqual(result.totals.surveyPlanningLabor, 105400, "測量職種の調査計画直接人件費");
assert.strictEqual(result.totals.surveyPlanningOverheadRate, 95.8, "R8測量方式の下限諸経費率");
assert.strictEqual(result.totals.surveyPlanningBusinessPrice, 206373, "調査計画を設計方式でなく測量方式で計算する");

const market = baseState();
market.lines = [{ id: "m1", lineType: "amount", serviceType: "geologyGeneral", costSystem: "geology", taskName: "機械ボーリング", quantity: 20, unit: "m", unitPrice: 15000, correctionFactor: 1.2 }];
result = engine.calculateEstimate(market, master, prices[2026].roles, 0);
assert.strictEqual(result.lines[0].amount, 360000, "地質一般の市場単価×数量×補正係数");
assert.strictEqual(result.totals.geologyLabor, 360000, "市場単価項目を地質一般の諸経費対象へ計上する");

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

let quantity = engine.calculateStandardQuantity("1km当り", { quantity1: 2.5 });
assert.strictEqual(quantity.valid, true, "延長数量を受け付ける");
assert.strictEqual(quantity.multiplier, 2.5, "1km標準歩掛を2.5kmへ比例する");
assert.strictEqual(engine.standardQuantitySummary(quantity), "2.5 km ÷ 標準 1 km ＝ 2.5倍", "数量計算根拠を表示する");

quantity = engine.calculateStandardQuantity("10箇所当り", { quantity1: 25 });
assert.strictEqual(quantity.multiplier, 2.5, "10箇所標準歩掛を25箇所へ比例する");
assert.strictEqual(engine.parseStandardQuantity("10箇所当り").dimensions[0].integer, true, "箇所数は整数入力にする");

quantity = engine.calculateStandardQuantity("1孔当り1回当り", { quantity1: 3, quantity2: 4 });
assert.strictEqual(quantity.multiplier, 12, "孔数と観測回数の複合数量を乗じる");
assert.strictEqual(quantity.quantities.length, 2, "複合標準単位を個別入力に分ける");

quantity = engine.calculateStandardQuantity("10,000m2当り", { quantity1: 69000 });
assert.strictEqual(quantity.multiplier, 6.9, "面積を標準10,000m2単位へ換算する");
assert.strictEqual(engine.calculateStandardQuantity("1橋当り", { quantity1: "" }).valid, false, "数量の空欄を1として補完しない");
assert.strictEqual(engine.calculateStandardQuantity("1橋当り", { quantity1: 1.5 }).valid, false, "橋数の小数入力を拒否する");
assert.strictEqual(engine.validateDomainValue(1.5, "m2").valid, true, "面積は連続量として小数入力を受け付ける");
assert.strictEqual(engine.validateDomainValue(1.5, "回").valid, false, "回数は整数以外を拒否する");
assert.strictEqual(engine.validateDomainValue(1.2345, "km").valid, false, "距離は小数第3位を超える入力を拒否する");

let coverage = engine.classifyPresetCoverage({ ...master.verifiedPresets[0], verificationStatus: "source-table-crosschecked" });
assert.strictEqual(coverage.status, "base-walk-verified", "職種別歩掛表の確認と条件規則までの検証を区別する");
assert.strictEqual(coverage.canCalculate, true, "条件表・補正式を持たない確認済み歩掛は自動計算できる");
coverage = engine.classifyPresetCoverage({ ...master.verifiedPresets[0], verificationStatus: "source-table-crosschecked" }, null, { adjustments: [{ type: "rate", rate: 0.1 }], parameterTables: [], formulas: [] });
assert.strictEqual(coverage.status, "incomplete-rule", "原表歩掛だけ確認済みでも条件表・補正式が未完了なら通常積算から分離する");
assert.strictEqual(coverage.canCalculate, false, "未構造化の条件表を利用者選択だけで自動積算扱いにしない");
coverage = engine.classifyPresetCoverage({ ...master.verifiedPresets[0] });
assert.strictEqual(coverage.canCalculate, false, "検証状態がないプリセットを既定で許可しない");
coverage = engine.classifyPresetCoverage({ ...master.verifiedPresets[0] }, { status: "verified-rule" }, { adjustments: [{ type: "rate", rate: 0.1 }] });
assert.strictEqual(coverage.status, "verified-rule", "出典付き構造化条件は人工表確認より優先する");
assert.strictEqual(coverage.canCalculate, true, "出典付き構造化条件を計算できる");
coverage = engine.classifyPresetCoverage({ label: "2-1-2 編成人員 人員", verificationStatus: "national-reference" });
assert.strictEqual(coverage.status, "reference-only", "編成人員表を数量比例の歩掛として扱わない");
assert.strictEqual(coverage.canCalculate, false, "関連する日当たり作業量がない編成人員表は自動計算しない");
coverage = engine.classifyPresetCoverage({ label: "2-3-1 道路詳細設計（A）", verificationStatus: "national-reference" });
assert.strictEqual(coverage.status, "incomplete-rule", "補正未実装の全国標準候補は自動計算不可として区別する");
assert.strictEqual(coverage.canCalculate, false, "条件規則のない候補を数量比例だけで追加しない");
coverage = engine.classifyPresetCoverage({ label: "2-1-2 編成人員 人員", serviceType: "geologyGeneral", verificationStatus: "source-table-crosschecked" });
assert.strictEqual(coverage.status, "reference-only", "地質の編成人員表も単独の市場単価項目として扱わない");
assert.strictEqual(coverage.canCalculate, false, "関連する規格・作業量がない編成人員表を自動計算しない");
coverage = engine.classifyPresetCoverage({ label: "2-1-1 機械ボーリング", serviceType: "geologyGeneral", verificationStatus: "source-table-crosschecked" });
assert.strictEqual(coverage.status, "market-rate-input", "条件規則が完了した地質一般だけ市場単価入力へ接続する");
assert.strictEqual(coverage.canCalculate, true, "根拠付き市場単価方式で完成済み地質項目を計算できる");
coverage = engine.classifyPresetCoverage({ label: "2-1-2 機械ボーリング", serviceType: "geologyGeneral", verificationStatus: "source-table-crosschecked" }, null, { adjustments: [{ type: "rate", rate: 0.1 }], parameterTables: [], formulas: [] });
assert.strictEqual(coverage.status, "incomplete-rule", "地質市場単価でも関連補正が未構造化なら通常積算へ出さない");
assert.strictEqual(coverage.canCalculate, false, "市場単価入力だけで未実装補正を補った扱いにしない");

const detailed = baseState();
detailed.additionalCosts = [
  { id: "a1", category: "market", costBucket: "geologyDirectNonLabor", name: "機械ボーリング", quantity: 12.5, unit: "m", unitPrice: 15000, source: "見積書A", sourceDate: "2026-08-24" },
  { id: "a2", category: "transport", costBucket: "geologyExcluded", name: "運搬費", quantity: 1, unit: "式", unitPrice: 80000, source: "見積書B", sourceDate: "2026-08-24" }
];
result = engine.calculateEstimate(detailed, master, prices[2026].roles, 0);
assert.strictEqual(result.totals.geologyDirectNonLabor, 187500, "根拠付き市場単価を地質直接経費へ計上する");
assert.strictEqual(result.totals.geologyExcluded, 80000, "運搬等の諸経費対象外積上げを区別する");
assert.strictEqual(result.additionalCosts[0].amount, 187500, "積上費用は数量×単価で円未満切捨てする");

console.log("OK: consulting/design/geology calculation checks passed");
