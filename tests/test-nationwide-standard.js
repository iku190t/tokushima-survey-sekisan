"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const engine = require(path.join(__dirname, "..", "engine.js"));

const root = path.join(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "official-role-prices.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "national-standard-masters.js"), "utf8"), context);

const masters = JSON.parse(JSON.stringify(context.window.SEKISAN_NATIONAL_STANDARD_MASTERS));
const rolePrices = JSON.parse(JSON.stringify(context.window.OFFICIAL_ROLE_PRICES));

const expected = {
  2024: { overhead: [91.2, 51.7, 371.23, -0.107], secondClass: [3073858, 307300, 3073000, 256634] },
  2025: { overhead: [95.8, 61.4, 288.5, -0.084], secondClass: [3387528, 338700, 3387000, 285250] },
  2026: { overhead: [95.8, 61.4, 288.5, -0.084], secondClass: [3448507, 344800, 3448000, 290555] }
};

assert.strictEqual(masters.length, 3, "全国標準参考は令和6・7・8年度の3マスター");
assert.deepStrictEqual(masters.map((master) => master.fiscalYear).sort(), [2024, 2025, 2026]);

for (const master of masters) {
  const year = master.fiscalYear;
  assert.strictEqual(master.id, `standard-r${year - 2018}-${year}`);
  assert.strictEqual(master.jurisdictionCode, "mlit");
  assert.strictEqual(master.verificationStatus, "standard-reference", `${year}: 県版検証済みとは表示しない`);
  assert.strictEqual(master.scopeStatus, "national-standard-reference");
  assert.strictEqual(master.walkYear, year);
  assert.strictEqual(master.rateYear, year);
  assert.strictEqual(master.workItems.length, 134, `${year}: 134作業項目`);
  assert.ok(master.audit.method.includes("国土交通省"), `${year}: 国交省資料による全国標準参考として表示する`);
  assert.ok(master.audit.limitations.some((text) => text.includes("独自歩掛")), `${year}: 地域差分の限界を明記`);
  assert.ok(master.audit.limitations.some((text) => text.includes("原表ページは未対応")), `${year}: 現行全編の項目別ページが未対応であることを明記する`);
  assert.ok(master.sourceLinks.some((source) => source.url.includes("mlit.go.jp/tec/content/")), `${year}: 国交省基準PDFを出典表示`);
  assert.ok(master.sourceLinks.some((source) => source.label.includes("技術者単価")), `${year}: 国交省技術者単価を出典表示`);
  assert.ok(master.sourceLinks.every((source) => source.url.includes("mlit.go.jp")), `${year}: 出典を国交省公式資料だけにする`);
  assert.ok(master.workItems.every((item) => !item.source?.standardPage && !item.source?.ratioPage), `${year}: 県版全編のページ番号を全国標準へ流用しない`);

  assert.deepStrictEqual(
    [master.overhead.lowerRate, master.overhead.upperRate, master.overhead.a, master.overhead.b],
    expected[year].overhead,
    `${year}: 年度別諸経費率`
  );
  for (const [role, definition] of Object.entries(master.roles)) {
    assert.strictEqual(definition.price, rolePrices[year].roles[role], `${year}: ${role} の全国測量技術者単価`);
  }
  const item = master.workItems.find((entry) => entry.code === "2-2-1-1");
  const result = engine.calculateItem({ masterItem: item, quantity: 10, correctionRate: 0 }, master, {});
  assert.deepStrictEqual(
    [result.standardDirect, result.unitPrice, result.directWork, result.precision],
    expected[year].secondClass,
    `${year}: 2級基準点測量10点の固定値`
  );

  const routeCrossSection = master.workItems.find((entry) => entry.code === "4-1-10");
  const widthInterval = routeCrossSection.correctionRules.find((rule) => rule.id === "crossSectionWidthInterval");
  assert.strictEqual(widthInterval.type, "matrix", `${year}: 路線横断測量の幅・間隔表を2次元条件として収録`);
  assert.deepStrictEqual(widthInterval.dimensions.map((dimension) => dimension.options.length), [16, 5], `${year}: 測量幅16区分・測点間隔5区分`);
  assert.strictEqual(Object.keys(widthInterval.rates).length, 80, `${year}: 幅×間隔80組合せを漏れなく収録`);
  assert.strictEqual(widthInterval.rates["45-75|20"], 0, `${year}: 標準60m・20mは変化率0`);
  assert.strictEqual(widthInterval.rates["lt45|10"], 0.6, `${year}: 表3.4左上の変化率`);
  assert.strictEqual(widthInterval.rates["250-300|100"], 0.1, `${year}: 表3.4右下の変化率`);
  const routeApplicability = {
    "4-1-1": [], "4-1-2": ["region", "traffic"], "4-1-3": ["region", "traffic"], "4-1-4": ["region"],
    "4-1-5": ["region"], "4-1-6": ["region", "traffic", "curves"], "4-1-7": ["region", "traffic", "curves", "interval"],
    "4-1-8": ["region", "traffic"], "4-1-9": ["region", "traffic"], "4-1-10": ["region", "traffic", "curves", "crossSectionWidthInterval"],
    "4-1-11": ["region", "traffic"], "4-1-12": ["region", "traffic"], "4-1-13": ["region", "traffic"]
  };
  for (const [code, ruleIds] of Object.entries(routeApplicability)) {
    const routeItem = master.workItems.find((entry) => entry.code === code);
    assert.deepStrictEqual(routeItem.correctionRules.map((rule) => rule.id), ruleIds, `${year}: ${code}を路線測量変化率適用表どおりに割当`);
  }

  for (const [code, baseWidth] of [["5-1-6", 400], ["5-1-8", 100], ["5-1-9", 100]]) {
    const riverCrossSection = master.workItems.find((entry) => entry.code === code);
    assert.strictEqual(riverCrossSection.conditionFormula.default, baseWidth, `${year}: ${code}の標準測量幅`);
    assert.strictEqual(riverCrossSection.conditionFormula.a, 1 / baseWidth, `${year}: ${code}の幅比例係数`);
    const riverResult = engine.calculateItem({ masterItem: riverCrossSection, quantity: 10, conditionValue: baseWidth * 1.5 }, master, {});
    assert.strictEqual(riverResult.conditionFactor, 1.5, `${year}: ${code}は断面数×測量幅で比例補正`);
  }
  assert.ok(master.workItems.filter((entry) => /幅|間隔/.test(entry.standard || "")).every((entry) => entry.conditionFormula || entry.correctionRules.some((rule) => rule.type === "matrix")), `${year}: 標準欄に幅・間隔がある全項目へ入力規則を接続`);
}

console.log("OK: nationwide R6-R8 standard reference master checks passed");
