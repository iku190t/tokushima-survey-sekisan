"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "verified-work-item-expansions.js"), "utf8"), context);
const expansion = JSON.parse(JSON.stringify(context.window.SEKISAN_VERIFIED_WORK_ITEM_EXPANSIONS[0]));

assert.strictEqual(expansion.fiscalYear, 2026, "令和8年度だけに適用する");
assert.strictEqual(expansion.replaceCode, "11-3-2", "旧作業一式を置換する");
assert.strictEqual(expansion.items.length, 8, "UAVレーザ測量を8工程へ分ける");
assert.deepStrictEqual(expansion.items.map((item) => item.name), [
  "UAVレーザ測量 現地踏査",
  "UAVレーザ測量 計測計画の作成",
  "UAVレーザ測量 固定局の設置",
  "UAVレーザ測量 調整点の設置",
  "UAVレーザ測量 計測",
  "UAVレーザ測量 オリジナルデータの作成",
  "UAVレーザ測量 その他の成果データの作成",
  "UAVレーザ測量 成果等の整理"
]);

const totals = expansion.items.reduce((sum, item) => {
  Object.entries(item.laborDays).forEach(([role, days]) => { sum[role] = (sum[role] || 0) + days; });
  return sum;
}, {});
Object.keys(totals).forEach((role) => { totals[role] = Math.round(totals[role] * 10) / 10; });
assert.deepStrictEqual(totals, { surveyEngineer: 30.2, surveyAssistantEngineer: 31.5, surveyChief: 0.5, surveyAssistant: 20 }, "8工程の合計人工が公式改定表と旧集約行に一致する");
assert.ok(expansion.sourceUrl.includes("mlit.go.jp/tec/content/001984600.pdf"), "国交省令和8年度改定資料を出典にする");

console.log("OK: R8 UAV laser detailed work item expansion checks passed");
