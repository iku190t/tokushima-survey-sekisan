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
const audit = JSON.parse(fs.readFileSync(path.join(root, "data", "source-audits", "hiroshima-r6-r8-expense-rates.json"), "utf8"));

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
  assert.strictEqual(master.audit.expenseRateRowsMatched, 108, `${year}: 直接経費率108行を照合済み`);
  assert.ok(master.audit.limitations.some((text) => text.includes("独自歩掛")), `${year}: 地域差分の限界を明記`);
  assert.ok(master.sourceLinks.some((source) => source.url.includes("mlit.go.jp/tec/content/")), `${year}: 国交省基準PDFを出典表示`);
  assert.ok(master.sourceLinks.some((source) => source.label.includes("技術者単価")), `${year}: 国交省技術者単価を出典表示`);

  assert.deepStrictEqual(
    [master.overhead.lowerRate, master.overhead.upperRate, master.overhead.a, master.overhead.b],
    expected[year].overhead,
    `${year}: 年度別諸経費率`
  );
  for (const [role, price] of Object.entries(rolePrices[year].roles)) {
    assert.strictEqual(master.roles[role].price, price, `${year}: ${role} の全国技術者単価`);
  }
  for (const [code, rates] of Object.entries(audit.years[year])) {
    const item = master.workItems.find((entry) => entry.code === code);
    assert.ok(item, `${year}: ${code} が存在する`);
    assert.deepStrictEqual(
      [item.machineRate, item.communicationRate, item.materialRate],
      [rates.machineRate, rates.communicationRate, rates.materialRate],
      `${year}: ${code} の直接経費率`
    );
  }

  const item = master.workItems.find((entry) => entry.code === "2-2-1-1");
  const result = engine.calculateItem({ masterItem: item, quantity: 10, correctionRate: 0 }, master, {});
  assert.deepStrictEqual(
    [result.standardDirect, result.unitPrice, result.directWork, result.precision],
    expected[year].secondClass,
    `${year}: 2級基準点測量10点の固定値`
  );
}

console.log("OK: nationwide R6-R8 standard reference master checks passed");
