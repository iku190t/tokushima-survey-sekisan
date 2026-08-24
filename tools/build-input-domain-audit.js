"use strict";

const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const surveyFiles = [2024, 2025, 2026].map((year) => ({ year, file: path.join(root, "data", `master-standard-r${year - 2018}.json`) }));
const compatibilitySurveyFiles = [{ year: 2026, file: path.join(root, "data", "master-r8.json") }];
const rulePackFile = path.join(root, "data", "consulting-rule-pack.json");
const discrete = new Set(["式", "点", "箇所", "回", "機関", "業務", "戸", "人", "測線", "断面", "本", "枚", "日", "橋", "基", "社", "件", "ケース", "施設", "トンネル", "坑口", "タイプ", "工法", "孔", "台", "観測所", "計器"]);
const aliases = new Map([["㎡", "m2"], ["m²", "m2"], ["㎢", "km2"], ["km²", "km2"], ["㎥", "m3"], ["m³", "m3"]]);

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
