"use strict";

const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const surveyFiles = [2024, 2025, 2026].map((year) => ({ year, file: path.join(root, "data", `master-standard-r${year - 2018}.json`) }));
const compatibilitySurveyFiles = [{ year: 2026, file: path.join(root, "data", "master-r8.json") }];
const rulePackFile = path.join(root, "data", "consulting-rule-pack.json");
const discrete = new Set(["式", "点", "箇所", "回", "機関", "業務", "戸", "人", "測線", "断面", "本", "枚", "日", "橋", "基", "社", "件", "ケース", "施設", "トンネル", "坑口", "タイプ", "工法", "孔", "台", "観測所", "計器"]);
const aliases = new Map([["㎡", "m2"], ["m²", "m2"], ["㎢", "km2"], ["km²", "km2"], ["㎥", "m3"], ["m³", "m3"]]);

const routeCrossSectionWidths = [
  ["lt45", "45m未満"], ["45-75", "45m以上75m未満"], ["75-95", "75m以上95m未満"],
  ["95-105", "95m以上105m未満"], ["105-115", "105m以上115m未満"], ["115-125", "115m以上125m未満"],
  ["125-135", "125m以上135m未満"], ["135-145", "135m以上145m未満"], ["145-155", "145m以上155m未満"],
  ["155-165", "155m以上165m未満"], ["165-175", "165m以上175m未満"], ["175-185", "175m以上185m未満"],
  ["185-195", "185m以上195m未満"], ["195-205", "195m以上205m未満"], ["205-250", "205m以上250m未満"],
  ["250-300", "250m以上300m以下"]
];
const routeCrossSectionIntervals = [["10", "10m"], ["20", "20m（標準）"], ["25", "25m"], ["50", "50m"], ["100", "100m"]];
const routeCrossSectionRates = {
  "10": [0.6, 0.8, 1, 1.1, 1.2, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.8, 1.9, 2.1, 2.4],
  "20": [-0.1, 0, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4, 0.4, 0.5, 0.6, 0.6, 0.6, 0.7, 0.8, 1],
  "25": [-0.1, 0, 0.1, 0.2, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4, 0.5, 0.5, 0.5, 0.6, 0.7, 0.9],
  "50": [-0.4, -0.3, -0.2, -0.2, -0.1, -0.1, -0.1, 0, 0, 0, 0.1, 0.1, 0.1, 0.1, 0.2, 0.4],
  "100": [-0.5, -0.4, -0.3, -0.3, -0.2, -0.2, -0.2, -0.2, -0.2, -0.1, -0.1, -0.1, -0.1, 0, 0, 0.1]
};

function applySurveyCalculationRules(master) {
  const crossSection = master.workItems.find((item) => item.code === "4-1-10");
  if (crossSection) {
    const matrix = {
      id: "crossSectionWidthInterval",
      label: "測量幅・測点間隔（4-2-5）",
      type: "matrix",
      dimensions: [
        { id: "width", label: "測量幅", options: routeCrossSectionWidths.map(([value, label]) => ({ value, label })) },
        { id: "interval", label: "測点間隔", options: routeCrossSectionIntervals.map(([value, label]) => ({ value, label })) }
      ],
      defaultValues: { width: "45-75", interval: "20" },
      rates: Object.fromEntries(routeCrossSectionIntervals.flatMap(([interval]) => routeCrossSectionWidths.map(([width], index) => [`${width}|${interval}`, routeCrossSectionRates[interval][index]]))),
      note: "標準は中心線から左右各30m（全幅60m）、測点間隔20m。幅と間隔の組合せを表3.4で補正します。",
      source: { url: "https://www.mlit.go.jp/common/001068098.pdf", printedPage: "1-2-49", physicalPage: 68 }
    };
    crossSection.correctionRules = [...(crossSection.correctionRules || []).filter((rule) => rule.id !== matrix.id), matrix];
  }

  const routeRuleMap = new Map();
  for (const item of master.workItems.filter((entry) => /^4-1-/.test(entry.code))) {
    for (const rule of item.correctionRules || []) if (!routeRuleMap.has(rule.id)) routeRuleMap.set(rule.id, rule);
  }
  const routeApplicability = {
    "4-1-1": [],
    "4-1-2": ["region", "traffic"],
    "4-1-3": ["region", "traffic"],
    "4-1-4": ["region"],
    "4-1-5": ["region"],
    "4-1-6": ["region", "traffic", "curves"],
    "4-1-7": ["region", "traffic", "curves", "interval"],
    "4-1-8": ["region", "traffic"],
    "4-1-9": ["region", "traffic"],
    "4-1-10": ["region", "traffic", "curves", "crossSectionWidthInterval"],
    "4-1-11": ["region", "traffic"],
    "4-1-12": ["region", "traffic"],
    "4-1-13": ["region", "traffic"]
  };
  for (const [code, ruleIds] of Object.entries(routeApplicability)) {
    const item = master.workItems.find((entry) => entry.code === code);
    if (!item) continue;
    item.correctionRules = ruleIds.map((ruleId) => JSON.parse(JSON.stringify(routeRuleMap.get(ruleId))));
  }

  for (const [code, baseWidth, widthLabel] of [
    ["5-1-6", 400, "測量幅（水面幅を含めない）"],
    ["5-1-8", 100, "測量幅（全幅）"],
    ["5-1-9", 100, "測量幅（全幅）"]
  ]) {
    const item = master.workItems.find((entry) => entry.code === code);
    if (!item) continue;
    item.conditionFormula = {
      label: widthLabel,
      unit: "m",
      default: baseWidth,
      a: 1 / baseWidth,
      b: 0,
      note: `断面数÷10×測量幅÷${baseWidth}mで比例計算します。測点間隔・流心延長による補正は行いません。`
    };
  }
}

function canonical(unit) { return aliases.get(String(unit || "式")) || String(unit || "式"); }
function domain(unit) {
  const normalized = canonical(unit);
  const integer = discrete.has(normalized);
  const decimals = integer ? 0 : 3;
  return { unit: normalized, kind: integer ? "integer" : "decimal", decimals, step: decimals ? 0.001 : 1, min: decimals ? 0.001 : 1, status: "audited-2026-08-24" };
}
function parseStandardUnit(value) {
  const source = String(value || "1式当り").replace(/㎡|m²/g, "m2").replace(/㎢|km²/g, "km2").replace(/㎥|m³/g, "m3").replace(/あたり/g, "当り").replace(/\s+/g, "");
  const regex = /(\d[\d,]*(?:\.\d+)?)\s*(km2|m2|m3|km|ha|m|t|時間|箇所|橋|基|トンネル|日|ケース|断面|坑口|タイプ|業務|工法|機関|孔|回|台|本|観測所|計器|式)(?=当り)/g;
  const dimensions = [];
  let match;
  while ((match = regex.exec(source))) dimensions.push({ baseQuantity: Number(match[1].replace(/,/g, "")), ...domain(match[2]) });
  return dimensions.length ? dimensions : [{ baseQuantity: 1, ...domain("式") }];
}

const audit = { schemaVersion: 1, auditedAt: "2026-08-24", policy: "離散量は整数、延長・面積・体積・重量・時間は小数第3位まで。全項目へ明示メタデータを付与し、既定値フォールバックを使用しない。", survey: [], consulting: null };
const masters = [];
for (const entry of surveyFiles) {
  const master = JSON.parse(fs.readFileSync(entry.file, "utf8"));
  applySurveyCalculationRules(master);
  const counts = {};
  for (const item of master.workItems || []) {
    const spec = domain(item.unit);
    item.quantityDecimals = spec.decimals;
    item.quantityInput = spec;
    counts[`${item.unit}:${spec.kind}`] = (counts[`${item.unit}:${spec.kind}`] || 0) + 1;
  }
  fs.writeFileSync(entry.file, JSON.stringify(master, null, 2) + "\n", "utf8");
  masters.push(master);
  audit.survey.push({ fiscalYear: entry.year, itemCount: master.workItems.length, explicitInputDomainCount: master.workItems.filter((item) => item.quantityInput?.status).length, unitCounts: counts });
}
for (const entry of compatibilitySurveyFiles) {
  const master = JSON.parse(fs.readFileSync(entry.file, "utf8"));
  applySurveyCalculationRules(master);
  for (const item of master.workItems || []) {
    const spec = domain(item.unit);
    item.quantityDecimals = spec.decimals;
    item.quantityInput = spec;
  }
  fs.writeFileSync(entry.file, JSON.stringify(master, null, 2) + "\n", "utf8");
}
fs.writeFileSync(path.join(root, "data", "national-standard-masters.js"), `window.SEKISAN_NATIONAL_STANDARD_MASTERS=${JSON.stringify(masters)};\n`, "utf8");

const pack = JSON.parse(fs.readFileSync(rulePackFile, "utf8"));
const consultingCounts = {};
for (const rule of pack.rules || []) {
  rule.quantitySpec = parseStandardUnit(rule.standardUnit);
  for (const spec of rule.quantitySpec) consultingCounts[`${spec.unit}:${spec.kind}`] = (consultingCounts[`${spec.unit}:${spec.kind}`] || 0) + 1;
}
audit.consulting = { ruleCount: pack.rules.length, explicitInputDomainCount: pack.rules.filter((rule) => rule.quantitySpec?.length).length, dimensionCounts: consultingCounts };
pack.inputDomainAudit = { auditedAt: audit.auditedAt, ruleCount: audit.consulting.ruleCount, status: "explicit-all-rules" };
fs.writeFileSync(rulePackFile, JSON.stringify(pack, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(root, "data", "consulting-rule-pack.js"), `window.CONSULTING_RULE_PACK = ${JSON.stringify(pack)};\n`, "utf8");
fs.writeFileSync(path.join(root, "data", "source-audits", "input-domain-audit.json"), JSON.stringify(audit, null, 2) + "\n", "utf8");
console.log(JSON.stringify(audit, null, 2));
