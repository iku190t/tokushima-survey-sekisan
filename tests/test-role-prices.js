"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "..", "data", "official-role-prices.js"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const presets = sandbox.window.OFFICIAL_ROLE_PRICES;
const engine = require(path.join(__dirname, "..", "engine.js"));
const master = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "master-r8.json"), "utf8"));

assert.deepStrictEqual(Array.from(Object.keys(presets).sort()), ["2022", "2023", "2024", "2025", "2026"]);
assert.strictEqual(presets[2026].roles.surveyChief, 61000, "R8 測量主任技師");
assert.strictEqual(presets[2026].roles.surveyAssistant, 37700, "R8 測量助手");
assert.strictEqual(presets[2025].roles.surveyWorker, 28700, "R7 測量補助員");
assert.strictEqual(presets[2024].roles.cameraOperator, 43500, "R6 撮影士");
assert.strictEqual(presets[2023].roles.surveyEngineer, 44000, "R5 測量技師");
assert.strictEqual(presets[2022].roles.boatOperator, 31400, "R4 測量船操縦士");
assert.ok(Object.values(presets).every((preset) => Object.keys(preset.roles).length === 10), "各年度10職種を収録");

Object.entries(presets[2022].roles).forEach(([key, price]) => { master.roles[key].price = price; });
const secondClass = master.workItems.find((item) => item.code === "2-2-1-1");
const r4Result = engine.calculateItem({ masterItem: secondClass, quantity: 10, correctionRate: 0 }, master, {});
assert.strictEqual(r4Result.standardLabor, 2348600, "R4単価へ切替後の2級基準点・標準直接人件費");
assert.strictEqual(r4Result.standardDirect, 2759605, "R4単価へ切替後の2級基準点・標準直接費");
assert.strictEqual(r4Result.unitPrice, 275900, "R4単価へ切替後の2級基準点・1点単価");

console.log("OK: MLIT official role price presets R4-R8");
