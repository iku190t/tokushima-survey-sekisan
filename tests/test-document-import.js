"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const engine = require(path.join(root, "document-import-engine.js"));
const reader = require(path.join(root, "document-reader.js"));
const surveyMaster = JSON.parse(fs.readFileSync(path.join(root, "data", "master-r8.json"), "utf8"));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data", "consulting-master.js"), "utf8"), context);
const consultingMaster = context.window.CONSULTING_MASTER;
const jurisdictions = [{ code: "36", name: "徳島県" }, { code: "mlit", name: "国土交通省（直轄）" }];

const pages = [{
  pageNumber: 1,
  method: "text",
  text: [
    "令和8年度 業務委託仕様書 徳島県",
    "業務名：○○地区 測量・地質調査・道路設計業務",
    "発注者：徳島県",
    "担当部署：県土整備部",
    "担当者：積算担当",
    "履行場所：徳島県内",
    "履行期間：令和8年4月1日から令和9年3月15日まで",
    "業務番号：TEST-001",
    "公告日：令和8年3月1日",
    "2級基準点測量 新点10点 伐採有り 20点",
    "水準測量 4級水準測量観測(レベル等による) 3.5km",
    "現地測量 (S=1/500) 現地測量(作業計画) 1業務",
    "設計計算 技師（A） 2.5人日",
    "地質解析 主任技師 0.75人日",
    "機械ボーリング 地質調査技師 1.25人日",
    "間接調査費 200,000円"
  ].join("\n")
}];

const result = engine.analyze(pages, surveyMaster, consultingMaster, jurisdictions);
assert.strictEqual(result.metadata.projectName, "○○地区 測量・地質調査・道路設計業務", "業務名を抽出する");
assert.strictEqual(result.metadata.fiscalYear, 2026, "令和8年度を西暦年度へ変換する");
assert.strictEqual(result.metadata.jurisdictionCode, "36", "発注機関候補を抽出する");
assert.strictEqual(result.metadata.orderingParty, "徳島県", "発注者を抽出する");
assert.strictEqual(result.metadata.department, "県土整備部", "担当部署を抽出する");
assert.strictEqual(result.metadata.contactName, "積算担当", "担当者を抽出する");
assert.strictEqual(result.metadata.workLocation, "徳島県内", "履行場所を抽出する");
assert.strictEqual(result.metadata.contractPeriod, "令和8年4月1日から令和9年3月15日まで", "履行期間を抽出する");
assert.strictEqual(result.metadata.documentNumber, "TEST-001", "業務番号を抽出する");
assert.strictEqual(result.metadata.documentDate, "令和8年3月1日", "公告日を抽出する");
assert.ok(result.metadata.fields.find((field) => field.key === "projectName" && field.selected), "基本情報を個別確認候補にする");
assert.ok(result.metadata.fields.find((field) => field.key === "jurisdiction" && !field.affectsCalculation && !field.selected && field.label === "見積提出先"), "見積提出先を計算マスターと分離して確認する");
assert.ok(result.metadata.fields.find((field) => field.key === "fiscalYear" && field.affectsCalculation && !field.selected), "金額へ影響する年度マスターは初期選択しない");

const control = result.candidates.find((candidate) => candidate.kind === "survey" && candidate.code === "2-2-1-1");
assert.ok(control, "2級基準点測量をマスターへ対応付ける");
assert.strictEqual(control.quantity, 20, "名称中の標準10点でなく末尾の積算数量20点を使う");

const leveling = result.candidates.find((candidate) => candidate.kind === "survey" && candidate.code === "3-1-4");
assert.ok(leveling, "4級水準測量をマスターへ対応付ける");
assert.strictEqual(leveling.quantity, 3.5, "距離の小数数量を保持する");

const fieldPlan = result.candidates.find((candidate) => candidate.kind === "survey" && candidate.code === "9-1-1");
assert.ok(fieldPlan, "現地測量作業計画をマスターへ対応付ける");
assert.strictEqual(fieldPlan.quantity, 1, "縮尺1/500を数量へ連結しない");

const design = result.candidates.find((candidate) => candidate.kind === "consulting" && candidate.role === "designEngineerA");
assert.ok(design, "設計の技師A人工を抽出する");
assert.strictEqual(design.serviceType, "design");
assert.strictEqual(design.taskName, "設計計算");
assert.strictEqual(design.days, 2.5);

const analysis = result.candidates.find((candidate) => candidate.kind === "consulting" && candidate.taskName === "地質解析");
assert.ok(analysis, "地質解析の人工を抽出する");
assert.strictEqual(analysis.serviceType, "geologyAnalysis");
assert.strictEqual(analysis.days, 0.75);

const geology = result.candidates.find((candidate) => candidate.kind === "consulting" && candidate.role === "geologyEngineer");
assert.ok(geology, "地質一般調査の人工を抽出する");
assert.strictEqual(geology.serviceType, "geologyGeneral");
assert.strictEqual(geology.days, 1.25);

const cost = result.candidates.find((candidate) => candidate.kind === "consultingCost" && candidate.costKey === "geologyIndirect");
assert.ok(cost, "地質の間接調査費を候補化する");
assert.strictEqual(cost.amount, 200000);
assert.strictEqual(cost.selected, false, "金額候補は誤計上防止のため初期選択しない");

const areaItem = surveyMaster.workItems.find((item) => item.code === "7-1-2-1");
const areaConversion = engine.convertSurveyQuantity(6.9, "standard", areaItem);
assert.strictEqual(areaConversion.sourceUnitLabel, "10,000m²", "用地測量の資料単位を標準10,000m²で表示する");
assert.strictEqual(areaConversion.quantity, 69000, "6.9×10,000m²を69,000m²へ換算する");
const scaledAreaResult = engine.analyze([{ pageNumber: 1, method: "text", text: "用地測量 資料調査 公図等の転写 (地積測量図以外の公図等の転写) 10,000m² 6.9" }], surveyMaster, consultingMaster, jurisdictions);
const scaledArea = scaledAreaResult.candidates.find((candidate) => candidate.kind === "survey" && candidate.code === "7-1-2-1");
assert.ok(scaledArea, "10,000m²単位の用地測量行を候補化する");
assert.strictEqual(scaledArea.sourceQuantity, 6.9, "資料上の数量6.9を保持する");
assert.strictEqual(scaledArea.sourceUnitLabel, "10,000m²", "資料上の単位を保持する");
assert.strictEqual(scaledArea.quantity, 69000, "自動候補も実面積69,000m²へ換算する");

const ocrResult = engine.analyze([{ ...pages[0], method: "ocr" }], surveyMaster, consultingMaster, jurisdictions);
assert.ok(ocrResult.warnings.some((warning) => warning.includes("OCR")), "OCRページは原文照合警告を出す");

const circledOcrText = [
  "令 和 ⑧ 年 度 業 務 委 託 仕 様 書",
  "発 注 機 関 : 徳 島 県",
  "業 務 名 : 〇 〇 地 区 測 量 ・ 地 質 調 査 ・ 道 路 設 計 業 務",
  "② 級 基 準 点 測 量 新 点 ⑩ 点 伐 採 有 り ⑳ 点",
  "水 準 測 量 ④ 紐 水 準 測 量 観 渡 ( レ ベ ル 等 に よ る ) ③.⑤km",
  "現 地 測 量 (S=①/⑤00) 現 地 測 量 ( 作 業 計 画 ) ① 業 務",
  "設 計 計 算 技 師 (A) ②.⑤ 人 日",
  "機 械 ボー リ ン グ 地 質 調 査 技 師 ①.②⑤ 人 日",
  "間 接 調 査 費 ⑳0.000 円"
].join("\n");
const circledResult = engine.analyze([{ pageNumber: 1, method: "ocr", text: circledOcrText }], surveyMaster, consultingMaster, jurisdictions);
assert.strictEqual(circledResult.metadata.fiscalYear, 2026, "OCR丸数字の令和年度を正規化する");
assert.strictEqual(circledResult.metadata.orderingParty, "徳島県", "OCR文字間隔を正規化して発注機関を基本情報候補にする");
assert.ok(circledResult.candidates.some((candidate) => candidate.kind === "survey" && candidate.code === "2-2-1-1" && candidate.quantity === 20), "OCR丸数字の基準点数量を正規化する");
assert.ok(circledResult.candidates.some((candidate) => candidate.kind === "survey" && candidate.unit === "km" && candidate.quantity === 3.5 && candidate.confidence === "low" && !candidate.selected), "等級文字を誤認した水準測量も低確信度候補として残す");
assert.ok(circledResult.candidates.some((candidate) => candidate.kind === "survey" && candidate.code === "9-1-1" && candidate.quantity === 1), "OCR縮尺を数量へ連結しない");
assert.ok(circledResult.candidates.some((candidate) => candidate.kind === "consulting" && candidate.role === "designEngineerA" && candidate.days === 2.5), "OCR丸数字の設計人工を正規化する");
assert.ok(circledResult.candidates.some((candidate) => candidate.kind === "consulting" && candidate.role === "geologyEngineer" && candidate.days === 1.25), "OCR丸数字の地質人工を正規化する");
assert.ok(circledResult.candidates.some((candidate) => candidate.kind === "consultingCost" && candidate.amount === 200000 && !candidate.selected), "OCRの点区切り金額は低確信度の未選択候補にする");

const summaryTableResult = engine.analyze([{
  pageNumber: 1,
  method: "text",
  text: [
    "業 務 数 量 総 括 表",
    "費目／工種／種別／細別／規格 単位 数量 摘要",
    "令和6-7年度 ○○地区工事用道路外用地調査等業務",
    "用地測量業務 式 1",
    "直接測量費 式 1"
  ].join("\n")
}], surveyMaster, consultingMaster, jurisdictions);
assert.strictEqual(summaryTableResult.metadata.projectName, "令和6-7年度 ○○地区工事用道路外用地調査等業務", "総括表の見出し行を業務名候補にする");
assert.ok(summaryTableResult.metadata.fields.some((field) => field.key === "projectName" && field.confidence === "medium" && field.selected), "ラベルのない業務名は要確認候補として選択する");
assert.strictEqual(summaryTableResult.candidates.length, 0, "総括表の式1を詳細な積算数量へ誤対応させない");

const grouped = reader.textItemsToLines([
  { str: "20点", transform: [1, 0, 0, 1, 180, 700] },
  { str: "2級基準点測量", transform: [1, 0, 0, 1, 20, 700] },
  { str: "別の行", transform: [1, 0, 0, 1, 20, 680] }
]);
assert.strictEqual(grouped, "2級基準点測量 20点\n別の行", "PDF文字要素を座標順で行へ復元する");

const textLayout = reader.textItemsToLayout([
  { str: "2級基準点測量", width: 90, height: 12, transform: [1, 0, 0, 1, 20, 700] },
  { str: "20点", width: 28, height: 12, transform: [1, 0, 0, 1, 180, 700] }
], { scale: 1, width: 500, height: 800, convertToViewportPoint: (x, y) => [x, 800 - y] });
assert.strictEqual(textLayout.length, 2, "PDFの同じ行でも離れた名称セルと数量セルを個別クリック領域にする");
assert.deepStrictEqual(textLayout.map((part) => part.text), ["2級基準点測量", "20点"], "文字ブロックごとの文字を保持する");
assert.ok(textLayout.every((part) => part.contextText === "2級基準点測量 20点"), "数量推定用に同じ横行の全文も保持する");
assert.ok(textLayout[0].left > 0 && textLayout[0].left < 0.1 && textLayout[0].width < 0.25, "PDF座標を文字ブロック比率へ変換する");

const fiveCellLayout = reader.textItemsToLayout([
  { str: "用地測量", width: 48, height: 12, transform: [1, 0, 0, 1, 20, 700] },
  { str: "打合せ", width: 36, height: 12, transform: [1, 0, 0, 1, 100, 700] },
  { str: "業務着手時", width: 60, height: 12, transform: [1, 0, 0, 1, 170, 700] },
  { str: "回", width: 12, height: 12, transform: [1, 0, 0, 1, 300, 700] },
  { str: "1", width: 8, height: 12, transform: [1, 0, 0, 1, 360, 700] }
], { scale: 1, width: 500, height: 800, convertToViewportPoint: (x, y) => [x, 800 - y] });
assert.deepStrictEqual(fiveCellLayout.map((part) => part.text), ["用地測量", "打合せ", "業務着手時", "回", "1"], "横一行の5つの表セルを個別選択できる");

const adjacentGlyphLayout = reader.textItemsToLayout([
  { str: "公", width: 12, height: 12, transform: [1, 0, 0, 1, 20, 700] },
  { str: "図", width: 12, height: 12, transform: [1, 0, 0, 1, 32, 700] },
  { str: "等", width: 12, height: 12, transform: [1, 0, 0, 1, 44, 700] }
], { scale: 1, width: 500, height: 800, convertToViewportPoint: (x, y) => [x, 800 - y] });
assert.deepStrictEqual(adjacentGlyphLayout.map((part) => part.text), ["公図等"], "隣接する1文字ずつのPDF要素は語としてまとめる");

const ocrLayout = reader.ocrLinesToLayout({ blocks: [{ paragraphs: [{ lines: [{ text: "水準測量 3.5km", bbox: { x0: 100, y0: 200, x1: 460, y1: 240 } }] }] }] }, 1000, 1400);
assert.strictEqual(ocrLayout.length, 1, "OCR行の座標をクリック領域にする");
assert.strictEqual(ocrLayout[0].text, "水準測量 3.5km", "OCR行の文字を保持する");
assert.ok(ocrLayout[0].top > 0.1 && ocrLayout[0].top < 0.2, "OCR座標をページ比率へ変換する");

const ocrCellLayout = reader.ocrLinesToLayout({ blocks: [{ paragraphs: [{ lines: [{ text: "公図等の転写 10,000㎡ 11", bbox: { x0: 100, y0: 200, x1: 700, y1: 240 }, words: [
  { text: "公図等の転写", bbox: { x0: 100, y0: 200, x1: 260, y1: 240 } },
  { text: "10,000㎡", bbox: { x0: 430, y0: 200, x1: 530, y1: 240 } },
  { text: "11", bbox: { x0: 650, y0: 200, x1: 690, y1: 240 } }
] }] }] }] }, 1000, 1400);
assert.deepStrictEqual(ocrCellLayout.map((part) => part.text), ["公図等の転写", "10,000㎡", "11"], "OCRでも離れた表セルを文字ブロックへ分ける");
assert.ok(ocrCellLayout.every((part) => part.contextText === "公図等の転写 10,000㎡ 11"), "OCR文字ブロックにも同じ横行の全文を保持する");

console.log("OK: document PDF/OCR extraction and review candidate checks passed");
