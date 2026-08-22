"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const ui = fs.readFileSync(path.join(root, "consulting.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "consulting-engine.js"), "utf8");
const master = fs.readFileSync(path.join(root, "data", "consulting-master.js"), "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const referencedIds = new Set([...ui.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]));
assert.deepStrictEqual([...referencedIds].filter((id) => !ids.has(id)), [], "consulting.jsから参照するHTML要素が揃う");

for (const id of ["consultingView", "consultingFiscalYear", "consultingServiceType", "consultingTaskName", "consultingRole", "consultingDays", "consultingLineBody", "consultingSummaryList", "consultingPrintButton"]) {
  assert.ok(html.includes(`id="${id}"`), `${id}を表示する`);
}
for (const file of ["data/consulting-master.js", "consulting-engine.js", "consulting.js"]) {
  assert.ok(html.includes(`src="${file}?v=`), `${file}を読み込む`);
  assert.ok(fs.existsSync(path.join(root, file)), `${file}が存在する`);
}
for (const type of ["土木設計業務", "調査・計画業務", "地質解析等調査業務", "地質一般調査業務"]) assert.ok(master.includes(type), `${type}を区分する`);
assert.ok(ui.includes('["design", "planning"]') && ui.includes('["geologyAnalysis", "geologyGeneral"]'), "設計業務と地質業務のタブで対象区分を分離する");
assert.ok(ui.includes('ezsekisan:businessscope') && ui.includes("activeConsultingScope"), "業務タブ切替を設計・地質入力へ反映する");
assert.ok(html.includes('data-consulting-scope="design"') && html.includes('data-consulting-scope="geology"'), "タブに対応する積上費用だけを表示する");
assert.ok(master.includes("designLead: 0.5") && master.includes("designEngineerA: 1.0"), "設計留意書の確認済み歩掛だけをプリセットする");
assert.ok(ui.includes("人工入力の行があります"), "未確認人工を提出前警告する");
assert.ok(html.includes("未入力の0円"), "0円を不要と誤認しない注意を表示する");
assert.ok(engine.includes("alpha / Math.max") && engine.includes("beta / Math.max"), "設計方式をその他原価と一般管理費に分ける");
assert.ok(engine.includes("geologyTarget * geologyOverheadRate"), "地質一般方式を独立計算する");
assert.ok(app.includes("draft.consulting?.lines?.length"), "設計・調査だけの案件も新規作成時に確認する");
assert.ok(app.includes('dataset.mode !== "consulting"'), "総合帳票を測量帳票で上書きしない");
assert.ok(ui.includes("t.surveyBusinessPrice") && ui.includes("t.designBusinessPrice") && ui.includes("t.geologyBusinessPrice"), "3区分を総合帳票へ合算する");
assert.ok(!master.includes("標準歩掛（推定）"), "推測歩掛を登録しない");

console.log("OK: consulting UI and report wiring checks passed");
