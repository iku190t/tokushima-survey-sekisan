const assert = require("assert");

global.window = global;
require("../data/national-standard-masters.js");
require("../data/consulting-rule-pack.js");
const catalog = require("../data/unit-catalog.js");
const surveyEngine = require("../engine.js");
const consultingEngine = require("../consulting-engine.js");
const importEngine = require("../document-import-engine.js");

const masters = global.SEKISAN_NATIONAL_STANDARD_MASTERS;
const pack = global.CONSULTING_RULE_PACK;
assert.deepStrictEqual(masters.map((master) => master.fiscalYear), [2024, 2025, 2026], "測量は令和6～8年度を監査する");
assert.deepStrictEqual([...pack.supportedYears].sort(), [2024, 2025, 2026], "設計・調査計画・地質は令和6～8年度を監査する");

const unknownSurveyUnits = [...new Set(masters.flatMap((master) => master.workItems.map((item) => item.unit)).filter((unit) => !catalog.definition(unit)))];
assert.deepStrictEqual(unknownSurveyUnits, [], "測量3年度の全作業項目単位が共通台帳にある");

const unknownConsultingUnits = [...new Set(pack.rules.flatMap((rule) => (rule.quantitySpec || []).map((entry) => entry.unit)).filter((unit) => !catalog.definition(unit)))];
assert.deepStrictEqual(unknownConsultingUnits, [], "設計・調査計画・地質3年度の全数量単位が共通台帳にある");

for (const unit of ["式", "点", "箇所", "回", "戸", "人", "測線", "断面", "本", "枚", "日", "橋", "基", "台", "観測所", "計器", "筆"]) {
  assert.strictEqual(catalog.inputDomain(unit).integer, true, `${unit}は整数入力`);
  assert.strictEqual(catalog.inputDomain(unit).step, 1, `${unit}の入力刻みは1`);
}
for (const unit of ["km", "m", "km²", "m²", "ha", "m³", "t", "時間"]) {
  assert.strictEqual(catalog.inputDomain(unit).decimals, 3, `${unit}は小数第3位まで`);
}

assert.strictEqual(catalog.normalize("㎡"), "m2", "㎡を面積単位へ正規化する");
assert.strictEqual(catalog.normalize("㎢"), "km2", "㎢を面積単位へ正規化する");
assert.strictEqual(surveyEngine.quantityRule({ unit: "筆" }).decimals, 0, "測量側でも筆は整数入力");
assert.strictEqual(consultingEngine.inputDomainForUnit("枚").decimals, 0, "設計等側でも枚は整数入力");
assert.strictEqual(consultingEngine.parseStandardQuantity("100枚当り").dimensions[0].baseQuantity, 100, "100枚当りを標準数量として解析する");

const photoItem = masters[2].workItems.find((item) => item.unit === "枚" && item.standardQuantity > 1);
assert.ok(photoItem, "枚を標準数量に使う測量項目がある");
const photoOptions = importEngine.surveyUnitOptions(photoItem);
assert.ok(photoOptions.some((option) => option.id === "standard" && option.factor === photoItem.standardQuantity), "PDF単位で標準数量（例：100枚）を選べる");
assert.strictEqual(importEngine.detectSurveyUnitId(`${photoItem.standardQuantity}枚`, photoItem), "standard", "PDFの標準単位を検出する");
assert.strictEqual(importEngine.convertSurveyQuantity(1, "standard", photoItem).quantity, photoItem.standardQuantity, "1×100枚を100枚へ換算する");

const areaItem = masters[2].workItems.find((item) => catalog.normalize(item.unit) === "m2");
assert.ok(areaItem, "面積単位の測量項目がある");
const standardAreaParts = importEngine.splitSurveyQuantityUnit(`${areaItem.standardQuantity}${areaItem.unit}`, areaItem);
assert.strictEqual(standardAreaParts.unitId, "standard", "10,000m²等は標準単位として優先判定する");
assert.strictEqual(standardAreaParts.quantityText, "", "標準単位内の10,000を積算数量へ誤入力しない");
const combinedAreaParts = importEngine.splitSurveyQuantityUnit(`12${areaItem.unit}`, areaItem);
assert.strictEqual(combinedAreaParts.unitId, "base", "12m²等から単位を分離する");
assert.strictEqual(combinedAreaParts.quantityText, "12", "標準単位でない数字＋単位から数字だけを数量へ分離する");
assert.strictEqual(importEngine.detectSurveyUnitId("12筆", areaItem), "筆", "PDFの筆を資料単位として認識する");
assert.strictEqual(importEngine.convertSurveyQuantity(12, "筆", areaItem).compatible, false, "筆を面積へ根拠なく換算しない");
assert.strictEqual(importEngine.detectSurveyUnitId("12筆", { unit: "筆", standardQuantity: 1 }), "base", "積算項目の単位が筆ならPDF単位を受け付ける");

console.log(`OK: audited ${catalog.definitions.length} shared units across four businesses and FY2024-2026`);
