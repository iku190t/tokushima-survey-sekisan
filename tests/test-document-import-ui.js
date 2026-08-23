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
for (const id of ["importView", "documentDropZone", "documentFileInput", "pdfClickWorkbench", "pdfClickPages", "pdfClickSelectedList", "pdfManualMapper", "pdfManualHeadingText", "pdfManualKind", "pdfManualSurveyCategory", "pdfManualSurveyCode", "pdfManualSurveyQuantity", "pdfManualSurveySourceUnit", "pdfManualSurveyConversion", "pdfManualConsultingService", "pdfManualConsultingTaskTemplate", "pdfManualConsultingTask", "pdfManualConsultingRole", "pdfManualConsultingDays", "pdfManualMetadataKey", "pdfManualMetadataValue", "addPdfManualCandidateButton", "ignorePdfManualLineButton", "selectDetectedPdfLinesButton", "clearPdfLineSelectionButton", "applyPdfSelectionNowButton", "openPdfSelectionReviewButton", "openPdfFullReviewButton", "documentImportDialog", "importMetadataPanel", "documentImportMetadataList", "toggleAllImportMetadata", "documentImportEmptyGuide", "importCandidateToolbar", "documentImportCandidateList", "applyDocumentImportButton"]) {
  assert.ok(ids.has(id), `${id} が存在する`);
}
assert.ok(html.includes("設計・測量・航空船舶・地質"), "資料取込の対象業務を4業務タブ順で明示する");
assert.ok(html.includes(">PDF・写真から取込み<"), "資料取込の表示名をPDF・写真から取込みに統一する");
const kindOptions = ['value="design">設計業務', 'value="survey">測量業務', 'value="aerial">航空・船舶関係', 'value="geology">地質業務', 'value="metadata">業務基本情報'];
assert.ok(kindOptions.every((option) => html.includes(option)), "PDF反映先を4業務区分と基本情報へ分ける");
assert.deepStrictEqual(kindOptions.map((option) => html.indexOf(option)), [...kindOptions.map((option) => html.indexOf(option))].sort((a, b) => a - b), "PDF反映先を設計・測量・航空船舶・地質・基本情報の順にする");
assert.ok(!html.includes("設計・調査・地質の人工"), "異なる積算基準の設計・調査・地質を1つの選択肢へまとめない");
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
assert.ok(ui.includes("taskOptions") && ui.includes("updateManualConsultingTasks") && ui.includes("pdfManualConsultingTaskTemplate"), "設計・地質も業務区分ごとの詳細項目から選べる");
assert.ok(app.includes("getSurveyItemsForScope") && ui.includes("consultingServiceIdsByKind") && ui.includes("businessKindForSurveyItem") && ui.includes("businessKindForService"), "PDF取込も本体と同じ4業務区分で項目・人工を絞る");
assert.ok(html.includes('draggable="true"') || ui.includes('draggable="true"'), "PDF文字ブロックをドラッグ開始できる");
assert.ok(!html.includes('id="pdfDragDock"') && !html.includes("PDFからドラッグして入力"), "別置きの重複したドラッグ入力欄を表示しない");
assert.ok(html.includes('data-pdf-drop-target="item"') && html.includes('data-pdf-drop-target="quantity"') && html.includes('data-pdf-drop-target="unit"'), "実入力欄を項目・数量・単位のドラッグ先にする");
const sidebarStart = html.indexOf('<aside class="pdf-click-sidebar">');
const sidebarEnd = html.indexOf("</aside>", sidebarStart);
const sidebarHtml = html.slice(sidebarStart, sidebarEnd);
const mapperIndex = html.indexOf('id="pdfManualMapper"');
const pendingPanelIndex = html.indexOf('class="pdf-pending-panel"');
const pendingListIndex = html.indexOf('id="pdfClickSelectedList"');
assert.ok(sidebarHtml.includes('id="pdfManualMapper"') && !sidebarHtml.includes('id="pdfClickSelectedList"'), "PDF右側には固定する入力エディターだけを置く");
assert.ok(mapperIndex >= 0 && mapperIndex < pendingPanelIndex && pendingPanelIndex < pendingListIndex, "反映待ち一覧をPDFと入力エディターの下へ分離する");
assert.ok(ui.includes("PDF_LINE_DRAG_TYPE") && ui.includes("applyDraggedPdfLine") && ui.includes("matchSurveyDrop") && ui.includes('addEventListener("dragstart"') && ui.includes('addEventListener("drop"'), "項目・数量を別々に右側へドロップして対応付ける");
assert.ok(ui.includes("pointerPdfDrag") && ui.includes("finishPointerPdfDrag") && ui.includes('addEventListener("pointermove"') && ui.includes('addEventListener("pointerup"'), "標準ドラッグ非対応環境とタッチ・ペン操作でも移動先を判定する");
assert.ok(ui.includes("manualSourceLineIds") && ui.includes("manualItemLineId") && ui.includes("manualQuantityLineId"), "別セルから取り込んだ項目と数量を同じ候補へ関連付ける");
assert.ok(ui.includes("manualUnitLineId") && ui.includes("convertSurveyQuantity") && ui.includes("sourceUnitLabel"), "単位セルを別に対応付けて資料数量を積算数量へ換算する");
assert.ok(ui.includes("applyPdfClickSelection") && ui.includes("target.item.applied = true"), "PDF画面から直接追加し、追加済み行を二重反映から保護する");
assert.ok(ui.includes("editablePdfTargets") && ui.includes("openSelectedTargetEditor") && ui.includes('data-pdf-edit-target='), "反映待ちへ追加した項目をクリックして変更画面を開ける");
assert.ok(ui.includes("currentEditingTarget") && ui.includes('Object.assign(editingTarget.item') && ui.includes('textContent = "変更を保存"'), "変更保存時は候補を重複追加せず既存項目を更新する");
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
assert.ok(!css.includes(".pdf-drag-dock") && css.includes(".pdf-field-drop-target.drag-over"), "実入力欄だけをドラッグ先として視覚表示する");
assert.ok(css.includes(".pdf-click-sidebar { position: sticky; top: 18px; align-self: start;") && css.includes(".pdf-pending-panel { display: grid;"), "入力エディターをPDF上端に固定し、反映待ちを独立配置する");
assert.ok(css.includes(".pdf-click-workbench { margin: 18px 0 0;") && css.includes("grid-template-columns: minmax(0,1fr) clamp(330px,22vw,390px)"), "PDF作業画面の重複余白を除き横幅を広く使う");
assert.ok(html.includes("pdf-drop-title") && html.includes("pdf-drop-callout") && css.includes("border: 2px dashed #4e9b7c"), "項目・数量・単位のドロップ先を常時強調する");

console.log("OK: document import review UI and safe apply wiring checks passed");
