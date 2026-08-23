const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const engine = require(path.join(root, "consulting-engine.js"));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data", "consulting-condition-rules.js"), "utf8"), context);
const rules = context.window.CONSULTING_CONDITION_RULES;
const preset = { serviceType: "design", label: "2-3-1 道路詳細設計（A）" };
const rule = engine.findConditionRule(preset, rules, 2026);

assert.ok(rule, "道路詳細設計Aに現行補正規則を対応付ける");
assert.strictEqual(rule.status, "verified-rule", "補正規則は出典ページ確認済みとする");
assert.deepStrictEqual(
  engine.classifyPresetCoverage({ ...preset, verificationStatus: "national-reference" }, rule),
  {
    status: "verified-rule",
    canCalculate: true,
    label: "出典付き条件規則を反映",
    note: "表示した補正・控除条件を数量比と標準歩掛へ反映します。案件固有の特記条件は別途照合してください。"
  },
  "出典付き条件規則がある項目だけ自動計算を許可する"
);
assert.deepStrictEqual(Array.from(rule.sources[0].pages), [19, 20], "基準書本体の補正表・適用説明ページを記録する");
assert.strictEqual(engine.findConditionRule({ serviceType: "design", label: "平面交差点詳細設計" }, rules, 2026), null, "別業務へ道路詳細設計補正を誤適用しない");
const preliminaryRule = engine.findConditionRule({ serviceType: "design", label: "2-2-2 道路予備修正設計（A）" }, rules, 2026);
assert.ok(preliminaryRule, "道路予備・予備修正設計A/Bへ共通補正規則を対応付ける");
const preliminaryCorrection = engine.calculateConditionCorrection(preliminaryRule, { terrain: "urban", lanes: "7-8", provisionalPlan: true, specialSlope: true });
assert.strictEqual(preliminaryCorrection.rate, 0.45, "予備設計補正は15%+10%+15%+5%=45%と加算する");
assert.strictEqual(preliminaryCorrection.factor, 1.45);
const conceptRule = engine.findConditionRule({ serviceType: "design", label: "2-1-1 道路概略設計（B）" }, rules, 2026);
assert.ok(conceptRule, "道路概略設計へ地形・暫定・成果分割補正を対応付ける");
assert.strictEqual(engine.calculateConditionCorrection(conceptRule, { terrain: "steep", provisionalPlan: true, splitDeliverables: true }).factor, 1.4, "概略設計は20%+15%+5%=40%補正");

const missing = engine.calculateConditionCorrection(rule, { terrain: "flat" });
assert.strictEqual(missing.valid, false, "必須の車線区分が空なら計算しない");

const corrected = engine.calculateConditionCorrection(rule, {
  terrain: "hilly",
  lanes: "1-2",
  multipleSection: true,
  noAncillary: true,
});
assert.strictEqual(corrected.valid, true);
assert.strictEqual(corrected.rate, 0.15, "補正係数は+10%-5%+20%-10%=+15%と加減算する");
assert.strictEqual(corrected.factor, 1.15, "標準歩掛へ1.15を乗じる");
assert.strictEqual(engine.normalizeDays(28.2 * corrected.factor), 32.43, "職種別人工を補正後に小数第3位へ丸める");

const inventory = JSON.parse(fs.readFileSync(path.join(root, "data", "source-audits", "mlit-effective-rule-pages.json"), "utf8"));
assert.strictEqual(inventory.effectiveEdition, 2011, "現行系列は平成23年度版を基礎とする");
assert.strictEqual(inventory.effectiveThroughFiscalYear, 2026, "令和8年度改定まで監査する");
assert.strictEqual(inventory.documentCount, 124, "現行系列124文書を索引化する");
assert.strictEqual(inventory.pageCount, 2102, "現行系列2102ページを索引化する");
assert.ok(inventory.ruleSignalPageCounts.correction >= 500, "補正記載ページを人工表とは別に抽出する");
assert.ok(inventory.documents.every((document) => document.edition === 2011), "旧平成14年度版を現行系列へ混在させない");

console.log("consulting condition-rule tests passed");
