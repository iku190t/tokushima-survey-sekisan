"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const engine = require(path.join(__dirname, "..", "engine.js"));
const master = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "master-r8.json"), "utf8"));

function close(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, got ${actual}`);
}

assert.strictEqual(master.workItems.length, 134, "令和8年度の収録項目数（率表108項目＋共通・別途算定26項目）");
assert.ok(master.workItems.every((item) => Object.keys(item.laborDays).length || item.pricingMode === "manualUnitPrice"), "全項目に労務構成または個別単価入力方式がある");
assert.deepStrictEqual(
  [master.workItems.find((item) => item.code === "6-2-1-1").standardQuantity, master.workItems.find((item) => item.code === "6-2-1-1").unit],
  [10, "測線"],
  "深浅測量の標準作業量"
);
assert.deepStrictEqual(
  master.workItems.find((item) => item.code === "8-2-1-4").laborDays,
  { pilot: 1, mechanic: 1, cameraOperator: 1 },
  "撮影滞留の独立歩掛"
);
assert.strictEqual(master.workItems.find((item) => item.code === "8-4-2-4").standardQuantity, 20, "レベル2500数値編集の標準面積");
assert.deepStrictEqual(
  master.workItems.find((item) => item.code === "10-2-1-8").laborDays,
  { surveyEngineer: 20, surveyAssistantEngineer: 60, surveyAssistant: 40 },
  "航空レーザ・グラウンドデータ作成の独立歩掛"
);

assert.strictEqual(engine.truncateSignificant(123456, 4), 123400, "有効4桁止め");
assert.strictEqual(engine.truncateSignificant(9999, 4), 9999, "4桁以下はそのまま");
assert.deepStrictEqual(engine.quantityRule({ unit: "点" }, master), { decimals: 0, step: 1, min: 0, integer: true }, "点数は整数入力");
assert.deepStrictEqual(engine.quantityRule({ unit: "km" }, master), { decimals: 3, step: .001, min: 0, integer: false }, "距離は小数第3位まで");
assert.strictEqual(engine.normalizeQuantity(9.9997, { unit: "点", standardQuantity: 10 }, master), 10, "点数の小数を整数へ正規化");
assert.strictEqual(engine.normalizeQuantity(9.9997, { unit: "km", standardQuantity: 10 }, master), 10, "距離の小数第4位を丸める");
assert.strictEqual(engine.normalizeQuantity(9.9994, { unit: "km", standardQuantity: 10 }, master), 9.999, "距離は小数第3位を保持");
close(engine.overheadRate(500000, master.overhead), 95.8, "50万円以下の諸経費率");
close(engine.overheadRate(1000000, master.overhead), 90.4, "100万円の諸経費率");
close(engine.overheadRate(100000001, master.overhead), 61.4, "1億円超の諸経費率");

const firstItem = master.workItems.find((item) => item.code === "2-1-1");
const first = engine.calculateItem({ id: "first", masterItem: firstItem, quantity: 5, correctionRate: 0 }, master, {});
assert.strictEqual(first.standardLabor, 1300850, "1級基準点測量の標準人件費");
assert.strictEqual(first.standardMachine, 182119, "同・機械経費");
assert.strictEqual(first.standardCommunication, 13008, "同・通信運搬費");
assert.strictEqual(first.standardMaterial, 32521, "同・材料費");
assert.strictEqual(first.rawUnitPrice, 305699, "同・補正前単価");
assert.strictEqual(first.unitPrice, 305600, "同・有効4桁単価");
assert.strictEqual(first.directWork, 1528000, "同・直接作業費");
assert.strictEqual(first.precision, 148296, "同・精度管理費");

const officialStyleExample = engine.calculateEstimate({
  lines: [],
  costs: { other: 1000000, inspection: 100000 },
  options: { useElectronicDeliverable: false, safetyRate: 0, adjustBusinessPrice: true, taxRate: .1 }
}, master);
assert.strictEqual(officialStyleExample.totals.directMeasurement, 1100000, "直接測量費");
assert.strictEqual(officialStyleExample.totals.overheadBase, 1000000, "成果検定費を除く諸経費対象額");
assert.strictEqual(officialStyleExample.totals.overhead, 904000, "諸経費");
assert.strictEqual(officialStyleExample.totals.businessPrice, 2004000, "業務価格");
assert.strictEqual(officialStyleExample.totals.tax, 200400, "消費税");
assert.strictEqual(officialStyleExample.totals.total, 2204400, "税込合計");

const electronic = engine.electronicDeliverableCost(1000000, master.electronicDeliverable);
assert.strictEqual(electronic, 48000, "電子成果品作成費の千円止め");
assert.strictEqual(engine.electronicDeliverableCost(1, master.electronicDeliverable), 0, "直接人件費が千円未満の場合");
assert.strictEqual(engine.electronicDeliverableCost(50000000, master.electronicDeliverable), 170000, "電子成果品作成費の上限");

const secondClass = master.workItems.find((item) => item.code === "2-2-1-1");
const secondClassResult = engine.calculateItem({ masterItem: secondClass, quantity: 10, correctionRate: 0 }, master, {});
assert.strictEqual(secondClassResult.standardDirect, 3448507, "2級基準点10点の標準直接費");
assert.strictEqual(secondClassResult.unitPrice, 344800, "2級基準点の1点当り有効4桁単価");
assert.strictEqual(secondClassResult.directWork, 3448000, "2級基準点10点の直接作業費");
assert.strictEqual(secondClassResult.precision, 290555, "伐採を除外しない2級基準点の精度管理費");
const normalizedSecondClass = engine.calculateItem({ masterItem: secondClass, quantity: 9.7, correctionRate: 0 }, master, {});
assert.strictEqual(normalizedSecondClass.quantity, 10, "計算エンジンでも点数を整数に正規化");

assert.deepStrictEqual(
  [master.workItems.find((item) => item.code === "4-1-9").standardQuantity, master.workItems.find((item) => item.code === "4-1-9").laborDays],
  [1, { surveyEngineer: 2.9, surveyAssistantEngineer: 2.9, surveyAssistant: 1.9 }],
  "縦断測量の1km歩掛"
);
assert.deepStrictEqual(
  [master.workItems.find((item) => item.code === "9-1-1").standardQuantity, master.workItems.find((item) => item.code === "9-1-2").standardQuantity],
  [1, .1],
  "現地測量の縮尺を数量として連結しない"
);
assert.deepStrictEqual(
  [master.workItems.find((item) => item.code === "5-1-4").precisionRate, master.workItems.find((item) => item.code === "6-3-1-1").precisionRate],
  [.10, .09],
  "名称ではなく作業種別による精度係数"
);
assert.deepStrictEqual(
  [master.workItems.find((item) => item.code === "7-1-3-1").precisionEligible, master.workItems.find((item) => item.code === "7-1-4-1").precisionEligible],
  [true, true],
  "用地測量の復元測量・補助基準点設置は精度管理対象"
);
assert.deepStrictEqual(
  [master.workItems.find((item) => item.code === "8-3-3").precisionRate, master.workItems.find((item) => item.code === "8-3-5").precisionRate, master.workItems.find((item) => item.code === "8-4-1-1").precisionRate, master.workItems.find((item) => item.code === "8-4-2-1").precisionRate],
  [.05, .05, .07, .03],
  "空中写真測量の工程別精度係数"
);
assert.strictEqual(engine.travelCost(2934900, "noLodging", 0, master.travel), 16435, "宿泊なし旅費交通費0.56%");
assert.strictEqual(engine.travelCost(50000000, "noLodging", 0, master.travel), 230000, "宿泊なし旅費交通費上限");
assert.strictEqual(engine.travelCost(50000000, "lodging", 0, master.travel), 313000, "宿泊あり旅費交通費上限");
assert.strictEqual(engine.travelCost(0, "manual", 123456, master.travel), 123456, "旅費交通費の実費積上げ");

const currentSurvey = master.workItems.find((item) => item.code === "9-1-2");
const currentSurveyResult = engine.calculateItem({ masterItem: currentSurvey, quantity: .2, correctionRate: 0 }, master, {});
assert.strictEqual(currentSurveyResult.quantityFactor, 1.72, "現地測量0.2km²の作業量補正係数");

const deepRiver = master.workItems.find((item) => item.code === "6-3-1-1");
const deepRiverResult = engine.calculateItem({ masterItem: deepRiver, quantity: 10, correctionRate: 0, conditionValue: 200 }, master, {});
assert.strictEqual(deepRiverResult.conditionFactor, 1.35, "河川深浅測量・水面幅200mの補正係数");

const uavPhoto = master.workItems.find((item) => item.code === "11-1-2");
const uavPhotoResult = engine.calculateItem({ masterItem: uavPhoto, quantity: .1, correctionRate: 0 }, master, {});
assert.strictEqual(uavPhotoResult.standardMachine, 433500, "UAV写真点群測量の機械経費等（3405×0.1+93千円）");
assert.strictEqual(uavPhotoResult.precision, Math.floor((uavPhotoResult.labor + Math.floor(433500 * .70)) * .06), "UAV写真点群測量の精度管理費対象機械分70%");

const manualFlight = master.workItems.find((item) => item.code === "8-2-1-2");
const manualFlightResult = engine.calculateItem({ masterItem: manualFlight, quantity: 2.5, manualUnitPrice: 100000 }, master, {});
assert.strictEqual(manualFlightResult.directWork, 250000, "総運航費の個別単価入力");
assert.strictEqual(manualFlightResult.precision, 12500, "総運航費を機械経費として撮影5%の精度管理費を算定");

console.log("OK: regulation audit checks passed (master mapping, precision, quantity formulas, travel, rounding, overhead)");
