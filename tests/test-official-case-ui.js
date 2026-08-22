"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const ui = fs.readFileSync(path.join(root, "official-case-search.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "official-case-engine.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const referencedIds = new Set([...ui.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]));

assert.deepStrictEqual([...referencedIds].filter((id) => !ids.has(id)), [], "公式案件UIから参照するHTML要素が揃う");
for (const file of ["official-case-engine.js", "official-case-search.js", "tests/test-official-case-engine.js"]) assert.ok(fs.existsSync(path.join(root, file)), `${file} が存在する`);
for (const id of ["caseSearchProjectName", "caseSearchOrganization", "caseSearchDocumentNumber", "caseSearchFiscalYear", "caseSearchPrefecture", "openKkjPortalSearchLink", "openKkjApiSearchLink", "kkjXmlFileInput", "officialCaseCandidateList", "caseSourceLedger", "caseSourceFileInput"]) assert.ok(ids.has(id), `${id} が存在する`);
assert.ok(html.includes("官公需情報ポータルの検索APIを使用"), "公式APIの利用元を表示する");
assert.ok(html.includes("検索結果は全公告の収録やリンクの有効性を保証しません"), "公式ポータル自体の限界を表示する");
assert.ok(ui.includes("parseKkjXml") && ui.includes("rankResults") && ui.includes("recordSources"), "公式XMLを解析・一致度順表示・資料候補化する");
assert.ok(ui.includes("crypto.subtle.digest") && ui.includes('"SHA-256"'), "手元資料のSHA-256をブラウザー内で計算する");
assert.ok(ui.includes("correction") && ui.includes("訂正・差替え候補"), "訂正版の優先確認警告がある");
assert.ok(app.includes("defaultCaseFile") && app.includes("function addCaseSources") && app.includes("function updateCaseSource") && app.includes("function removeCaseSource"), "案件資料台帳を保存・更新できる");
assert.ok(app.includes("portalKey") && app.includes("matchScore") && app.includes("sha256"), "取得元識別子・一致度・ハッシュを保存する");
assert.ok(!ui.includes("fetch(engine.API_BASE") && !ui.includes("fetch(\"https://www.kkj.go.jp/api"), "CORS非対応APIへ静的画面から失敗する直接fetchを行わない");
assert.ok(css.includes(".official-case-candidate") && css.includes(".case-source-ledger"), "候補と資料台帳の表示を整える");

console.log("OK: official case search UI, source ledger, revision warning, and safe static-site wiring passed");
