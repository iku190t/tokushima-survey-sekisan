"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));

for (const file of ["official-case-engine.js", "official-case-search.js", "tests/test-official-case-engine.js"]) assert.ok(fs.existsSync(path.join(root, file)), `${file} が存在する`);
for (const id of ["caseSearchProjectName", "caseSearchOrganization", "caseSearchDocumentNumber", "caseSearchFiscalYear", "caseSearchPrefecture", "openKkjPortalSearchLink", "openKkjApiSearchLink", "kkjXmlFileInput", "officialCaseCandidateList", "caseSourceLedger", "caseSourceFileInput"]) assert.ok(!ids.has(id), `${id} を利用者画面へ表示しない`);
assert.ok(!html.includes("公式案件検索・資料台帳") && !html.includes('src="official-case-engine.js') && !html.includes('src="official-case-search.js'), "公式案件検索UIと関連スクリプトを読み込まない");
assert.ok(app.includes("defaultCaseFile") && app.includes("function addCaseSources"), "既存保存JSONとの互換性のため旧資料台帳データ構造は保持する");

console.log("OK: official case search UI is removed while saved-data compatibility remains");
