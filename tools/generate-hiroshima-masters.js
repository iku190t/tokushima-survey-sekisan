"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const base = JSON.parse(fs.readFileSync(path.join(root, "data", "master-r8.json"), "utf8"));

const yearConfig = {
  2024: {
    era: "令和6年度",
    effectiveFrom: "2024-08-01",
    version: "2024.20240801.1",
    standardUrl: "https://chotatsu.pref.hiroshima.lg.jp/estimate/file/20240801.pdf",
    referenceUrl: "https://chotatsu.pref.hiroshima.lg.jp/estimate/file/20240801_sankou.pdf",
    nationalStandardUrl: "https://www.mlit.go.jp/tec/content/001984386.pdf",
    roleUrl: "https://www.mlit.go.jp/tec/content/001724089.pdf",
    roles: {
      surveyChief: 54600, surveyEngineer: 47100, surveyAssistantEngineer: 36900,
      surveyAssistant: 34600, surveyWorker: 25900, pilot: 56300,
      mechanic: 43200, cameraOperator: 43500, cameraAssistant: 36100, boatOperator: 36300
    },
    overhead: { lowerRate: 91.2, upperRate: 51.7, a: 371.23, b: -0.107 },
    uavLaser: {
      "11-3-1": { surveyChief: 1.3, surveyEngineer: 1.2, surveyAssistantEngineer: 0.6 },
      "11-3-2": { surveyEngineer: 25.1, surveyAssistantEngineer: 24.0, surveyAssistant: 16.0 }
    }
  },
  2025: {
    era: "令和7年度",
    effectiveFrom: "2025-08-01",
    version: "2025.20250801.1",
    standardUrl: "https://chotatsu.pref.hiroshima.lg.jp/estimate/file/20250801.pdf",
    referenceUrl: "https://chotatsu.pref.hiroshima.lg.jp/estimate/file/20250801_sankou.pdf",
    nationalStandardUrl: "https://www.mlit.go.jp/tec/content/001984378.pdf",
    roleUrl: "https://www.mlit.go.jp/tec/content/001864579.pdf",
    roles: {
      surveyChief: 60600, surveyEngineer: 52300, surveyAssistantEngineer: 41100,
      surveyAssistant: 34900, surveyWorker: 28700, pilot: 56300,
      mechanic: 43200, cameraOperator: 48200, cameraAssistant: 36400, boatOperator: 38300
    },
    overhead: { lowerRate: 95.8, upperRate: 61.4, a: 288.5, b: -0.084 },
    uavLaser: {
      "11-3-1": { surveyChief: 1.3, surveyEngineer: 1.2, surveyAssistantEngineer: 0.6 },
      "11-3-2": { surveyEngineer: 25.1, surveyAssistantEngineer: 24.0, surveyAssistant: 16.0 }
    }
  },
  2026: {
    era: "令和8年度",
    effectiveFrom: "2026-08-01",
    version: "2026.20260801.1",
    standardUrl: "https://chotatsu.pref.hiroshima.lg.jp/estimate/index/20260801-01.pdf",
    referenceUrl: "https://chotatsu.pref.hiroshima.lg.jp/estimate/index/20260801-02.pdf",
    nationalStandardUrl: "https://www.mlit.go.jp/tec/content/001867424.pdf",
    roleUrl: "https://www.mlit.go.jp/tec/content/001981914.pdf",
    roles: {
      surveyChief: 61000, surveyEngineer: 52700, surveyAssistantEngineer: 41300,
      surveyAssistant: 37700, surveyWorker: 29600, pilot: 62000,
      mechanic: 44200, cameraOperator: 51600, cameraAssistant: 38100, boatOperator: 42000
    },
    overhead: { lowerRate: 95.8, upperRate: 61.4, a: 288.5, b: -0.084 },
    uavLaser: {
      "11-3-1": { surveyChief: 0.9, surveyEngineer: 0.8, surveyAssistantEngineer: 0.5 },
      "11-3-2": { surveyChief: 0.5, surveyEngineer: 30.2, surveyAssistantEngineer: 31.5, surveyAssistant: 20.0 }
    }
  }
};

function parseExpenseRates(year) {
  const sourcePath = path.join(root, "tmp", "pdfs", "hiroshima", `r${year - 2018}-measurement.txt`);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`${sourcePath} がありません。公式PDFを pdftotext -layout で抽出してから再実行してください。`);
  }
  const rows = new Map();
  for (const line of fs.readFileSync(sourcePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\dl]+(?:-[\dl]+){2,3})\s+.*?(\d+(?:\.\d+)?)％\s+(\d+(?:\.\d+)?)％\s+(\d+(?:\.\d+)?)％\s*$/i);
    if (!match) continue;
    const code = match[1].replace(/l/gi, "1");
    assert(!rows.has(code), `${year}: ${code} の直接経費率が重複しています`);
    rows.set(code, {
      machineRate: Number(match[2]) / 100,
      communicationRate: Number(match[3]) / 100,
      materialRate: Number(match[4]) / 100
    });
  }
  assert.strictEqual(rows.size, 108, `${year}: 直接経費率表は108行でなければなりません`);
  return rows;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildMaster(year, rates) {
  const config = yearConfig[year];
  const master = clone(base);
  master.id = `r${year - 2018}-hiroshima-${year}`;
  master.masterVersion = config.version;
  master.jurisdictionCode = "34";
  master.jurisdictionName = "広島県";
  master.jurisdictionType = "prefecture";
  master.verificationStatus = "verified";
  master.scopeStatus = "verified";
  master.fiscalYear = year;
  master.walkYear = year;
  master.rateYear = year;
  master.label = `${config.era}・広島県測量業務（同年8月版）`;
  master.effectiveFrom = config.effectiveFrom;
  master.authority = "広島県土木建築局";

  for (const [key, price] of Object.entries(config.roles)) {
    assert(master.roles[key], `${year}: 未知の技術者職種 ${key}`);
    master.roles[key].price = price;
  }
  Object.assign(master.overhead, config.overhead);

  const itemCodes = new Set(master.workItems.map((item) => item.code));
  for (const code of rates.keys()) assert(itemCodes.has(code), `${year}: 直接経費率表の未知コード ${code}`);
  for (const item of master.workItems) {
    const rate = rates.get(item.code);
    if (rate) Object.assign(item, rate);
    if (config.uavLaser[item.code]) item.laborDays = clone(config.uavLaser[item.code]);
  }

  master.sources = [
    `${config.era} 土木設計業務等標準積算基準書（広島県・同年8月適用）`,
    `${config.era} 土木設計業務等標準積算基準書＜参考資料＞（広島県・同年8月適用）`,
    `${config.era} 設計業務委託等技術者単価（国土交通省・同年3月適用）`
  ];
  master.sourceLinks = [
    { label: `${config.era} 広島県 積算基準書`, url: config.standardUrl },
    { label: `${config.era} 広島県 積算基準書（参考資料）`, url: config.referenceUrl },
    { label: `${config.era} 国土交通省 設計業務委託等技術者単価`, url: config.roleUrl }
  ];
  master.audit = {
    method: "公式PDF原本の年度別照合",
    standardItemCount: master.workItems.length,
    expenseRateRowsMatched: rates.size,
    expenseRateCodeMismatches: 0,
    annualControls: ["技術者単価", "諸経費率", "直接経費率108行", "旅費交通費", "安全費", "電子成果品作成費", "UAVレーザ歩掛"],
    limitations: [
      "航空撮影・航空レーザ測量等の運航費、成果検定費、案件固有条件は別途入力・確認が必要",
      "発注案件の特記仕様、適用通知、改定・正誤表を契約図書で最終確認する"
    ]
  };
  return master;
}

function buildNationalStandardMaster(year, auditedMaster) {
  const config = yearConfig[year];
  const master = clone(auditedMaster);
  master.id = `standard-r${year - 2018}-${year}`;
  master.masterVersion = `${year}.national-reference.1`;
  master.jurisdictionCode = "mlit";
  master.jurisdictionName = "国土交通省（全国標準）";
  master.jurisdictionType = "national";
  master.verificationStatus = "standard-reference";
  master.scopeStatus = "national-standard-reference";
  master.label = `${config.era}・全国標準測量業務（参考版）`;
  master.effectiveFrom = "";
  master.authority = "国土交通省（全国標準参考）";
  master.sources = [
    `${config.era} 国土交通省 測量業務積算基準・標準歩掛等改定内容`,
    `${config.era} 国土交通省 設計業務委託等技術者単価`,
    `${config.era} 広島県公開全編で標準歩掛・直接経費率108行・諸経費率を年度照合`
  ];
  master.sourceLinks = [
    { label: `${config.era} 国土交通省 測量業務積算基準`, url: config.nationalStandardUrl },
    { label: "国土交通省 年度別の積算基準・標準歩掛等", url: "https://www.mlit.go.jp/tec/gyoumu_sekisan.html" },
    { label: `${config.era} 国土交通省 設計業務委託等技術者単価`, url: config.roleUrl },
    { label: `${config.era} 広島県公開全編（全国標準部分の年度照合元）`, url: config.standardUrl }
  ];
  master.audit.method = "国土交通省公開基準・技術者単価と、広島県公開全編による全国標準部分の年度照合";
  master.audit.limitations = [
    "都道府県・地方整備局等の独自歩掛、適用通知、労務単価、材料・市場・機械単価は未反映",
    "航空撮影・航空レーザ測量等の運航費、成果検定費、案件固有条件は別途入力・確認が必要"
  ];
  return master;
}

const rateAudit = { schemaVersion: 1, generatedFrom: "広島県公式PDFの pdftotext -layout 抽出", years: {} };
const masters = [];
const nationalMasters = [];
for (const year of [2024, 2025, 2026]) {
  const rates = parseExpenseRates(year);
  rateAudit.years[year] = Object.fromEntries([...rates.entries()].sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })));
  const master = buildMaster(year, rates);
  masters.push(master);
  const nationalMaster = buildNationalStandardMaster(year, master);
  nationalMasters.push(nationalMaster);
  fs.writeFileSync(path.join(root, "data", `master-hiroshima-r${year - 2018}.json`), `${JSON.stringify(master, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(root, "data", `master-standard-r${year - 2018}.json`), `${JSON.stringify(nationalMaster, null, 2)}\n`, "utf8");
}

fs.mkdirSync(path.join(root, "data", "source-audits"), { recursive: true });
fs.writeFileSync(path.join(root, "data", "source-audits", "hiroshima-r6-r8-expense-rates.json"), `${JSON.stringify(rateAudit, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(root, "data", "verified-masters.js"), `window.SEKISAN_VERIFIED_MASTERS=${JSON.stringify(masters)};\n`, "utf8");
fs.writeFileSync(path.join(root, "data", "national-standard-masters.js"), `window.SEKISAN_NATIONAL_STANDARD_MASTERS=${JSON.stringify(nationalMasters)};\n`, "utf8");

console.log(`Generated ${masters.length} Hiroshima masters and ${nationalMasters.length} nationwide standard reference masters with ${Object.keys(rateAudit.years[2026]).length} audited expense-rate rows per year.`);
