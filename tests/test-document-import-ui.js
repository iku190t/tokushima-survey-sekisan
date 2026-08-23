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
for (const id of ["importView", "documentDropZone", "documentFileInput", "pdfClickWorkbench", "pdfClickPages", "pdfClickSelectedList", "pdfDragDock", "pdfManualItemDrop", "pdfManualQuantityDrop", "pdfDragItemValue", "pdfDragQuantityValue", "pdfManualMapper", "pdfManualKind", "pdfManualSurveyCategory", "pdfManualSurveyCode", "pdfManualSurveyQuantity", "pdfManualConsultingService", "pdfManualConsultingRole", "pdfManualConsultingDays", "pdfManualMetadataKey", "pdfManualMetadataValue", "addPdfManualCandidateButton", "ignorePdfManualLineButton", "selectDetectedPdfLinesButton", "clearPdfLineSelectionButton", "applyPdfSelectionNowButton", "openPdfSelectionReviewButton", "openPdfFullReviewButton", "documentImportDialog", "importMetadataPanel", "documentImportMetadataList", "toggleAllImportMetadata", "documentImportEmptyGuide", "importCandidateToolbar", "documentImportCandidateList", "applyDocumentImportButton"]) {
  assert.ok(ids.has(id), `${id} が存在する`);
}
assert.ok(html.includes("設計・測量・航空船舶・地質"), "資料取込の対象業務を4業務タブ順で明示する");
assert.ok(html.includes("資料内容は外部送信しません"), "ブラウザー内処理を明示する");
assert.ok(html.includes('accept="application/pdf,image/png,image/jpeg,image/webp'), "PDFと写真を選択できる");
assert.ok(!html.includes("documentPasteText") && !html.includes("analyzePastedTextButton") && !ui.includes("analyzePastedText"), "原文貼り付け解析を画面と処理から撤去する");
assert.ok(!html.includes("公式案件検索・資料台帳") && !html.includes("official-case-search.js") && !html.includes("official-case-engine.js"), "公式案件検索・資料台帳を画面と読込対象から撤去する");
assert.ok(reader.includes("page.getTextContent"), "文字入りPDFを直接抽出する");
assert.ok(reader.includes("textItemsToLayout") && reader.includes("segmentPdfRow") && reader.includes("contextText") && reader.includes("convertToViewportPoint") && reader.includes('toDataURL("image/jpeg"'), "PDFページ画像と表セル単位の文字ブロック座標をクリック表示用に保持する");
assert.ok(reader.includes('method = "ocr"'), "文字を持たないページだけOCRへ切り替える");
assert.ok(reader.includes('createWorker(["jpn", "eng"]'), "日本語と英語のOCRをブラウザー内で実行する");
assert.ok(reader.includes("ocrLinesToLayout") && reader.includes("blocks: true"), "OCR行の座標もクリック表示用に保持する");
assert.ok(reader.includes("MAX_FILE_BYTES") && reader.includes("MAX_PAGES"), "ファイル容量とページ数を制限する");
assert.ok(!reader.includes("FormData") && !reader.includes('fetch(file'), "資料ファイルを外部へアップロードしない");
assert.ok(ui.includes("renderReview") && ui.includes("showModal"), "反映前に一覧確認ダイアログを開く");
assert.ok(ui.includes("sourceText") && ui.includes("confidenceLabel") && ui.includes("methodLabel"), "原文・確信度・抽出方法を確認できる");
assert.ok(ui.includes("metadataHtml") && ui.includes("import-metadata-select") && ui.includes("import-metadata-value"), "業務基本情報を項目別に確認・修正・選択できる");
assert.ok(ui.includes("renderPdfClickWorkbench") && ui.includes("pdf-line-hotspot") && ui.includes("clickLineTargets"), "PDF上の候補行をクリックして反映待ちへ選択できる");
assert.ok(ui.includes("clickLines.set") && !ui.includes('if (!targets.length) return ""'), "自動判定の有無にかかわらずPDFの全抽出行をクリック対象にする");
assert.ok(ui.includes("openManualMapper") && ui.includes("addManualCandidate") && ui.includes("metadataLabels"), "未判定行の反映先・数量・人工・基本情報を右側で指定できる");
assert.ok(ui.includes("surveyCategoryOptions") && ui.includes("populateManualSurveyItems") && ui.includes("pdfManualSurveyCategory"), "長い測量項目を分類で絞り込んで詳細項目を選べる");
assert.ok(html.includes('draggable="true"') || ui.includes('draggable="true"'), "PDF文字ブロックをドラッグ開始できる");
assert.ok(html.includes('data-pdf-drop-target="item"') && html.includes('data-pdf-drop-target="quantity"'), "右側に項目と数量のドラッグ先がある");
assert.ok(ui.includes("PDF_LINE_DRAG_TYPE") && ui.includes("applyDraggedPdfLine") && ui.includes("matchSurveyDrop") && ui.includes('addEventListener("dragstart"') && ui.includes('addEventListener("drop"'), "項目・数量を別々に右側へドロップして対応付ける");
assert.ok(ui.includes("pointerPdfDrag") && ui.includes("finishPointerPdfDrag") && ui.includes('addEventListener("pointermove"') && ui.includes('addEventListener("pointerup"'), "標準ドラッグ非対応環境とタッチ・ペン操作でも移動先を判定する");
assert.ok(ui.includes("manualSourceLineIds") && ui.includes("manualItemLineId") && ui.includes("manualQuantityLineId"), "別セルから取り込んだ項目と数量を同じ候補へ関連付ける");
assert.ok(ui.includes("applyPdfClickSelection") && ui.includes("target.item.applied = true"), "PDF画面から直接追加し、追加済み行を二重反映から保護する");
const directApply = ui.slice(ui.indexOf("function applyPdfClickSelection"), ui.indexOf("function updateSelectionState"));
assert.ok(!directApply.includes(".view-tab") && !directApply.includes("documentImportDialog"), "PDFからの直接追加は画面を切り替えず確認ダイアログも要求しない");
assert.ok(ui.includes("openPdfSelectionReviewButton") && ui.includes("renderReview(currentFileName, currentAnalysis)"), "必要な場合は従来の詳しい確認・修正画面も開ける");
assert.ok(ui.includes('dataset.action = hasResults ? "apply" : "close"') && ui.includes("読み取れる項目なし・閉じる"), "候補0件では選択を要求せず閉じられる");
assert.ok(ui.includes('$("importCandidateToolbar").hidden = candidateCount === 0') && ui.includes('$("importMetadataPanel").hidden = metadataCount === 0'), "候補がない区分の選択操作を隠す");
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
assert.ok(css.includes('.pdf-line-hotspot[data-mapped="false"]') && css.includes(".pdf-manual-mapper"), "未判定行と右側反映先エディターを視覚的に区別する");
assert.ok(css.includes(".pdf-manual-drop-target") && css.includes(".pdf-field-drop-target.drag-over"), "ドラッグ先を通常時とドロップ中で視覚表示する");

console.log("OK: document import review UI and safe apply wiring checks passed");
