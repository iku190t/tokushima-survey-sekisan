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

for (const id of ["consultingView", "consultingFiscalYear", "consultingServiceType", "consultingTaskTemplate", "consultingTaskName", "consultingRole", "consultingDays", "consultingPresetSearch", "consultingRuleGroup", "consultingPreset", "consultingPresetBasis", "consultingQuantityFields", "consultingConditionsConfirmed", "consultingConditionsLabel", "consultingPresetStatus", "consultingLineBody", "consultingSummaryList", "consultingPrintButton"]) {
  assert.ok(html.includes(`id="${id}"`), `${id}を表示する`);
}
for (const file of ["data/consulting-master.js", "consulting-engine.js", "consulting.js"]) {
  assert.ok(html.includes(`src="${file}?v=`), `${file}を読み込む`);
  assert.ok(fs.existsSync(path.join(root, file)), `${file}が存在する`);
}
assert.ok(html.includes('src="data/consulting-standard-walks.js?v='), "年度別の設計・調査計画・地質標準歩掛を読み込む");
assert.ok(html.includes('src="data/consulting-condition-rules.js?v=') && html.includes('id="consultingConditionFields"'), "補正・適用条件データと動的入力欄を読み込む");
assert.ok(html.includes('src="data/consulting-rule-pack.js?v='), "国交省ページ照合済み規則パックを読み込む");
assert.ok(html.includes('src="data/estimation-compliance-catalog.js?v=') && html.includes('id="consultingRegionalAuthority"'), "積算基準体系と地方整備局等の確認台帳を読み込む");
assert.ok(html.includes('id="consultingNotificationReference"') && html.includes('id="consultingSpecificationReference"') && ui.includes("priceSourcesConfirmed"), "適用通知・特記仕様・価格根拠を個別確認する");
assert.ok(html.includes('id="consultingAdditionalCostBody"') && ui.includes("additionalCosts") && engine.includes("additionalAmount"), "市場単価・材料・機械・運搬・個別見積を根拠付きで計上する");
assert.ok(html.includes('src="reference-case-engine.js?v=') && html.includes('id="referenceCaseFileInput"') && ui.includes("compareReferenceFile"), "匿名化した正解積算を費目別照合する");
assert.ok(html.includes('src="data/official-source-catalog.js?v='), "国交省年度別8資料の台帳を読み込む");
for (const type of ["土木設計業務", "調査・計画業務", "地質解析等調査業務", "地質一般調査業務"]) assert.ok(master.includes(type), `${type}を区分する`);
for (const task of ["設計条件の確認", "施工計画", "資料整理とりまとめ", "孔内水平載荷試験", "地下水位観測", "土質・岩石試験"]) assert.ok(master.includes(task), `${task}を詳細項目として選べる`);
assert.ok(html.includes("詳細項目（作業工程）") && ui.includes("consultingTaskTemplate"), "設計・地質で詳細項目を選んで内訳名称へ反映する");
assert.ok(ui.includes('entry.id === "design"') && ui.includes('entry.id === "planning"') && ui.includes('["geologyAnalysis", "geologyGeneral"]'), "設計・調査計画・地質のタブで対象区分を分離する");
assert.ok(ui.includes('ezsekisan:businessscope') && ui.includes("activeConsultingScope"), "業務タブ切替を設計・地質入力へ反映する");
assert.ok(html.includes('data-consulting-scope="design-planning"') && html.includes('data-consulting-scope="geology"'), "タブに対応する積上費用だけを表示する");
assert.ok(master.includes('id: "design-note-r8"') && master.includes('id: "design-note-r7"') && master.includes('id: "design-note-r6"') && master.includes("designLead: 0.5") && master.includes("designEngineerA: 1.0"), "令和6～8年度の設計留意書歩掛をプリセットする");
assert.ok(ui.includes("CONSULTING_RULE_PACK") && ui.includes("preset.fiscalYear") && ui.includes("consultingPresetSearch"), "照合済み標準歩掛を年度・業務タブ・検索語で絞る");
assert.ok(ui.includes("parseStandardQuantity") && ui.includes("calculateStandardQuantity") && ui.includes("quantitySummary"), "標準単位から数量比と職種別人工を自動算出する");
assert.ok(ui.includes("consultingConditionsConfirmed") && ui.includes("特記仕様書と一致"), "業務種類・適用条件の確認なしに追加しない");
assert.ok(ui.includes("familyForPreset") && ui.includes("consulting-parameter-value") && ui.includes("consultingFormulaModel") && ui.includes("compileFormula"), "適用条件表と補正式を歩掛へ結び付ける");
assert.ok(!html.includes('id="consultingPresetMultiplier"'), "利用者へ補正係数の手計算を要求しない");
assert.ok(html.includes("基準書にない作業・見積項目を手動調整する"), "人工直接入力を基準外の手動調整へ分離する");
assert.ok(ui.includes("OFFICIAL_SOURCE_CATALOG") && ui.includes('source.jurisdictionCode === "mlit"') && ui.includes("fullBook.ruleCount"), "選択年度の国交省資料と照合済み歩掛を計算根拠に表示する");
assert.ok(ui.includes("人工入力の行があります"), "未確認人工を提出前警告する");
assert.ok(ui.includes("市場単価による積算") && ui.includes("consultingMarketUnitPrice"), "地質一般を人工比例にせず市場単価で計算する");
assert.ok(html.includes("未入力の0円"), "0円を不要と誤認しない注意を表示する");
assert.ok(engine.includes("alpha / Math.max") && engine.includes("beta / Math.max"), "設計方式をその他原価と一般管理費に分ける");
assert.ok(engine.includes("geologyTarget * geologyOverheadRate"), "地質一般方式を独立計算する");
assert.ok(engine.includes("surveyPlanningBusinessPrice") && engine.includes("surveyRulesByYear"), "測量職種の調査計画を年度別測量経費方式で計算する");
assert.ok(app.includes("draft.consulting?.lines?.length"), "設計・調査だけの案件も新規作成時に確認する");
assert.ok(app.includes('dataset.mode !== "consulting"'), "総合帳票を測量帳票で上書きしない");
assert.ok(ui.includes("t.surveyBusinessPrice") && ui.includes("t.designBusinessPrice") && ui.includes("t.geologyBusinessPrice"), "3区分を総合帳票へ合算する");
assert.ok(ui.includes('__qa_report") === "consulting"') && ui.includes("renderPrintDocument(currentResult())"), "公開HTTPSから総合3帳票を実PDF検査できる匿名QA入口を持つ");
assert.ok(!master.includes("標準歩掛（推定）"), "推測歩掛を登録しない");

console.log("OK: consulting UI and report wiring checks passed");
