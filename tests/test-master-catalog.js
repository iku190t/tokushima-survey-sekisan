"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data", "prefectures.js"), "utf8"), context);
const prefectures = context.window.SEKISAN_PREFECTURES;
const authorities = context.window.SEKISAN_JURISDICTIONS;
assert.strictEqual(prefectures.length, 47, "47都道府県を収録する");
assert.strictEqual(authorities.length, 48, "国土交通省と47都道府県を収録する");
assert.strictEqual(new Set(authorities.map((entry) => entry.code)).size, 48, "発注機関コードが重複しない");
assert.deepStrictEqual(JSON.parse(JSON.stringify(prefectures.find((entry) => entry.code === "36"))), { code: "36", name: "徳島県" });
assert.deepStrictEqual(JSON.parse(JSON.stringify(authorities.find((entry) => entry.code === "mlit"))), { code: "mlit", name: "国土交通省（直轄）", type: "national" });

const catalog = JSON.parse(fs.readFileSync(path.join(root, "data", "master-catalog.json"), "utf8"));
assert.strictEqual(catalog.schemaVersion, 1);
assert.ok(Array.isArray(catalog.masters) && catalog.masters.length > 0, "配信カタログにマスターがある");
for (const entry of catalog.masters) {
  assert.strictEqual(entry.verificationStatus, "verified", `${entry.id} は検証済みだけを配信する`);
  assert.ok(authorities.some((region) => region.code === entry.jurisdictionCode && region.name === entry.jurisdictionName), `${entry.id} の発注機関が一覧と一致する`);
  const raw = fs.readFileSync(path.join(root, entry.path));
  assert.strictEqual(crypto.createHash("sha256").update(raw).digest("hex"), entry.sha256, `${entry.id} のSHA-256が一致する`);
  const master = JSON.parse(raw.toString("utf8"));
  assert.strictEqual(master.id, entry.id);
  assert.strictEqual(master.masterVersion, entry.version);
  assert.strictEqual(master.jurisdictionCode, entry.jurisdictionCode);
  assert.strictEqual(master.fiscalYear, entry.fiscalYear);
  assert.strictEqual(master.verificationStatus, "verified");
}

console.log("OK: nationwide jurisdiction and verified master catalog checks passed");
