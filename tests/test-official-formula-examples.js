"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const examples = JSON.parse(fs.readFileSync(path.join(root, "data", "source-audits", "official-formula-examples.json"), "utf8"));
const surveyEngine = require(path.join(root, "engine.js"));
const master = JSON.parse(fs.readFileSync(path.join(root, "data", "master-r8.json"), "utf8"));

const hydrology = examples.examples.find((entry) => entry.id === "mlit-hydrology-mp-linear");
assert.strictEqual(0.02 * hydrology.inputs.N2 + 2.65, hydrology.expected, "国交省の流量観測式を固定値で回帰確認する");
assert.strictEqual(hydrology.runtimeEnabled, false, "全条件未照合の公式式を本番計算へ有効化しない");

const secondClass = examples.examples.find((entry) => entry.id === "survey-r8-second-class-10-points");
const item = master.workItems.find((entry) => entry.code === secondClass.inputs.workItemCode);
const calculated = surveyEngine.calculateItem({ masterItem: item, quantity: secondClass.inputs.quantity, correctionRate: 0 }, master, {});
for (const [key, value] of Object.entries(secondClass.expected)) assert.strictEqual(calculated[key], value, `公式照合済み測量例の${key}が一致する`);

console.log("OK: official formula/reference examples remain exact and unverified formulas remain gated");
