"use strict";

const assert = require("assert");
const path = require("path");
const engine = require(path.join(__dirname, "..", "reference-case-engine.js"));

let result = engine.compare({ schemaVersion: 1, expectedTotals: { designLabor: 100000, total: 220000 } }, { designLabor: 100000, total: 220000 });
assert.strictEqual(result.matched, true, "全費目が1円単位で一致する");
result = engine.compare({ schemaVersion: 1, expectedTotals: { designLabor: 100000, total: 220001 } }, { designLabor: 100000, total: 220000 });
assert.deepStrictEqual(result.rows.map((row) => row.difference), [0, -1], "費目別の差額を保持する");
assert.strictEqual(result.matched, false, "1円差も不一致にする");
assert.strictEqual(engine.validate({ schemaVersion: 1, projectName: "実名案件", expectedTotals: { total: 1 } }).valid, false, "案件名を含むファイルを匿名化不足として拒否する");
assert.strictEqual(engine.validate({ schemaVersion: 1, expectedTotals: { unknown: 1 } }).valid, false, "対象外費目を拒否する");

console.log("OK: anonymous reference-case line-item comparison engine");
