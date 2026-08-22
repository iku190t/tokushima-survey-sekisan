"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const engine = require(path.join(__dirname, "..", "engine.js"));

const root = path.join(__dirname, "..");
const audit = JSON.parse(fs.readFileSync(path.join(root, "data", "source-audits", "hiroshima-r6-r8-expense-rates.json"), "utf8"));
const roleContext = { window: {} };
vm.createContext(roleContext);
vm.runInContext(fs.readFileSync(path.join(root, "data", "official-role-prices.js"), "utf8"), roleContext);

const expected = {
  2024: {
    overhead: [91.2, 51.7, 371.23, -0.107],
    secondClass: [2616050, 235444, 170043, 52321, 3073858, 307300, 3073000, 256634],
    uavPlan: { surveyChief: 1.3, surveyEngineer: 1.2, surveyAssistantEngineer: 0.6 },
    uavWork: { surveyEngineer: 25.1, surveyAssistantEngineer: 24, surveyAssistant: 16 }
  },
  2025: {
    overhead: [95.8, 61.4, 288.5, -0.084],
    secondClass: [2907750, 261697, 159926, 58155, 3387528, 338700, 3387000, 285250],
    uavPlan: { surveyChief: 1.3, surveyEngineer: 1.2, surveyAssistantEngineer: 0.6 },
    uavWork: { surveyEngineer: 25.1, surveyAssistantEngineer: 24, surveyAssistant: 16 }
  },
  2026: {
    overhead: [95.8, 61.4, 288.5, -0.084],
    secondClass: [2934900, 293490, 161419, 58698, 3448507, 344800, 3448000, 290555],
    uavPlan: { surveyChief: 0.9, surveyEngineer: 0.8, surveyAssistantEngineer: 0.5 },
    uavWork: { surveyChief: 0.5, surveyEngineer: 30.2, surveyAssistantEngineer: 31.5, surveyAssistant: 20 }
  }
};

const masters = {};
for (const year of [2024, 2025, 2026]) {
  const master = JSON.parse(fs.readFileSync(path.join(root, "data", `master-hiroshima-r${year - 2018}.json`), "utf8"));
  masters[year] = master;
  assert.strictEqual(master.id, `r${year - 2018}-hiroshima-${year}`);
  assert.strictEqual(master.jurisdictionCode, "34");
  assert.strictEqual(master.jurisdictionName, "広島県");
  assert.strictEqual(master.fiscalYear, year);
  assert.strictEqual(master.walkYear, year);
  assert.strictEqual(master.rateYear, year);
  assert.strictEqual(master.verificationStatus, "verified");
  assert.strictEqual(master.workItems.length, 134, `${year}: 134作業項目`);
  assert.strictEqual(master.audit.expenseRateRowsMatched, 108, `${year}: 直接経費率108行を照合済み`);
  assert.strictEqual(Object.keys(audit.years[year]).length, 108, `${year}: 公式PDF抽出監査表108行`);

  for (const [code, rates] of Object.entries(audit.years[year])) {
    const item = master.workItems.find((entry) => entry.code === code);
    assert.ok(item, `${year}: ${code} がマスターに存在する`);
    assert.deepStrictEqual(
      [item.machineRate, item.communicationRate, item.materialRate],
      [rates.machineRate, rates.communicationRate, rates.materialRate],
      `${year}: ${code} の直接経費率が公式PDF抽出値と一致する`
    );
  }

  assert.deepStrictEqual(
    [master.overhead.lowerRate, master.overhead.upperRate, master.overhead.a, master.overhead.b],
    expected[year].overhead,
    `${year}: 年度別諸経費率`
  );
  for (const [role, definition] of Object.entries(master.roles)) {
    assert.strictEqual(definition.price, roleContext.window.OFFICIAL_ROLE_PRICES[year].roles[role], `${year}: ${role} の測量技術者単価`);
  }
  assert.deepStrictEqual(master.workItems.find((item) => item.code === "11-3-1").laborDays, expected[year].uavPlan, `${year}: UAVレーザ作業計画歩掛`);
  assert.deepStrictEqual(master.workItems.find((item) => item.code === "11-3-2").laborDays, expected[year].uavWork, `${year}: UAVレーザ作業一式歩掛`);
  assert.deepStrictEqual([master.travel.noLodging.rate, master.travel.noLodging.maximum, master.travel.lodging.rate, master.travel.lodging.maximum], [.0056, 230000, .0083, 313000], `${year}: 旅費交通費`);
  assert.deepStrictEqual(master.safetyRates.map((entry) => entry.rate), [0, .04, .035, .03, .025], `${year}: 安全費率`);
  assert.deepStrictEqual([master.electronicDeliverable.coefficient, master.electronicDeliverable.exponent, master.electronicDeliverable.minimum, master.electronicDeliverable.maximum], [2.3, .44, 10000, 170000], `${year}: 電子成果品作成費`);
  assert.strictEqual(master.sourceLinks.length, 3, `${year}: 基準書・参考資料・技術者単価の公式リンク`);

  const item = master.workItems.find((entry) => entry.code === "2-2-1-1");
  const result = engine.calculateItem({ masterItem: item, quantity: 10, correctionRate: 0 }, master, {});
  assert.deepStrictEqual(
    [result.standardLabor, result.standardMachine, result.standardCommunication, result.standardMaterial, result.standardDirect, result.unitPrice, result.directWork, result.precision],
    expected[year].secondClass,
    `${year}: 2級基準点測量10点の年度別固定値`
  );
}

const rateSignature = (master) => master.workItems.map((item) => `${item.code}:${item.machineRate}/${item.communicationRate}/${item.materialRate}`).join("|");
assert.notStrictEqual(rateSignature(masters[2024]), rateSignature(masters[2025]), "令和6年度の直接経費率を令和7年度から流用しない");
assert.notStrictEqual(rateSignature(masters[2025]), rateSignature(masters[2026]), "令和7年度の直接経費率を令和8年度から流用しない");
assert.notStrictEqual(masters[2024].roles.surveyChief.price, masters[2025].roles.surveyChief.price, "令和6・7年度の技術者単価を分離する");
assert.notStrictEqual(masters[2025].roles.surveyChief.price, masters[2026].roles.surveyChief.price, "令和7・8年度の技術者単価を分離する");

console.log("OK: Hiroshima R6-R8 complete annual master audit checks passed");
