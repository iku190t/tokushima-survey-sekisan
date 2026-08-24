"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const ledger = JSON.parse(fs.readFileSync(path.join(root, "data", "source-audits", "consulting-crosswalk-resolution.json"), "utf8"));

assert.deepStrictEqual(ledger.summary, {
  reviewedPages: 63,
  calculationEnabledPages: 0,
  excludedPages: 63,
  noTablePages: 48,
  tablePages: 15,
  officialFamilyLocatedPages: 9,
  blockedTablePages: 6
}, "低確度・未照合63ページを漏れなく個別判定する");
assert.strictEqual(ledger.pages.length, 63, "63ページの個別台帳を保持する");
assert.ok(ledger.pages.every((page) => page.calculationEnabled === false && page.reason), "低確度ページをすべて計算対象外にする");
assert.ok(ledger.pages.filter((page) => page.officialReference).every((page) => /^https:\/\/www\.mlit\.go\.jp\//.test(page.officialReference)), "確認できた系統は国交省公式資料だけを記録する");

console.log("OK: all 63 low/unmatched pages are individually ledgered and calculation-blocked");
