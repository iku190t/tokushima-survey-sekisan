"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const ui = fs.readFileSync(path.join(root, "document-import.js"), "utf8");
const reader = fs.readFileSync(path.join(root, "document-reader.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const consulting = fs.readFileSync(path.join(root, "consulting.js"), "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const referencedIds = new Set([...ui.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]));

assert.deepStrictEqual([...referencedIds].filter((id) => !ids.has(id)), [], "資料取込UIから参照するHTML要素が揃う");
for (const file of ["document-import-engine.js", "document-reader.js", "document-import.js", "tests/test-document-import.js"]) {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} が存在する`);
}
for (const id of ["importView", "documentDropZone", "documentFileInput", "documentPasteText", "documentImportDialog", "documentImportMetadataList", "toggleAllImportMetadata", "documentImportCandidateList", "applyDocumentImportButton"]) {
  assert.ok(ids.has(id), `${id} が存在する`);
}
assert.ok(html.includes("設計・測量・航空船舶・地質"), "資料取込の対象業務を4業務タブ順で明示する");
assert.ok(html.includes("資料内容は外部送信しません"), "ブラウザー内処理を明示する");
assert.ok(html.includes('accept="application/pdf,image/png,image/jpeg,image/webp'), "PDFと写真を選択できる");
assert.ok(reader.includes("page.getTextContent"), "文字入りPDFを直接抽出する");
assert.ok(reader.includes('method = "ocr"'), "文字を持たないページだけOCRへ切り替える");
assert.ok(reader.includes('createWorker(["jpn", "eng"]'), "日本語と英語のOCRをブラウザー内で実行する");
assert.ok(reader.includes("MAX_FILE_BYTES") && reader.includes("MAX_PAGES"), "ファイル容量とページ数を制限する");
assert.ok(!reader.includes("FormData") && !reader.includes('fetch(file'), "資料ファイルを外部へアップロードしない");
assert.ok(ui.includes("renderReview") && ui.includes("showModal"), "反映前に一覧確認ダイアログを開く");
assert.ok(ui.includes("sourceText") && ui.includes("confidenceLabel") && ui.includes("methodLabel"), "原文・確信度・抽出方法を確認できる");
assert.ok(ui.includes("metadataHtml") && ui.includes("import-metadata-select") && ui.includes("import-metadata-value"), "業務基本情報を項目別に確認・修正・選択できる");
assert.ok(ui.includes("window.confirm") && ui.includes("changesMaster"), "発注機関・年度の切替前に再確認する");
assert.ok(ui.includes("import-survey-code") && ui.includes("import-survey-quantity"), "測量項目と数量を修正できる");
assert.ok(ui.includes("import-consulting-service") && ui.includes("import-consulting-role") && ui.includes("import-consulting-days"), "設計・調査・地質の区分・職種・人工を修正できる");
assert.ok(app.includes("function importSurveyLines") && app.includes("SekisanEngine.normalizeQuantity"), "確認済み測量数量を単位別規則で正規化して反映する");
assert.ok(app.includes("function applyImportedMetadata") && app.includes("defaultProjectInfo"), "確認済み業務基本情報を構造化して反映する");
for (const key of ["orderingParty", "department", "contactName", "workLocation", "contractPeriod", "documentNumber", "documentDate"]) {
  assert.ok(html.includes(`data-project-info="${key}"`), `${key} の反映先入力欄がある`);
}
assert.ok(consulting.includes("ezsekisan:consultingimport") && consulting.includes("engine.normalizeDays"), "確認済み設計・調査人工を小数第3位へ正規化して反映する");
assert.ok(!app.includes("sourceText: String(entry.sourceText") && !consulting.includes("sourceText: String(entry.sourceText"), "抽出原文を保存JSONへ残さない");
assert.ok(css.includes(".import-review-dialog") && css.includes(".import-candidate[data-confidence=\"low\"]"), "確認画面と低確信度警告の表示がある");

console.log("OK: document import review UI and safe apply wiring checks passed");
