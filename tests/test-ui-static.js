"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const analytics = fs.readFileSync(path.join(root, "analytics.js"), "utf8");
const nationalMasters = fs.readFileSync(path.join(root, "data", "national-standard-masters.js"), "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const referenced = new Set([...app.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]));
const missing = [...referenced].filter((id) => !ids.has(id));

assert.deepStrictEqual(missing, [], `app.jsから参照されるHTML要素が不足: ${missing.join(", ")}`);
assert.ok(html.includes("<title>web積算｜") && html.includes("<h1>web積算</h1>"), "アプリタイトルをweb積算に統一する");
const businessTabs = [...html.matchAll(/<button class="view-tab(?: active)?" data-view="[^"]+" data-business-scope="([^"]+)"[^>]*>([^<]+)<\/button>/g)].map((match) => [match[1], match[2]]);
assert.deepStrictEqual(businessTabs, [["design", "設計業務"], ["survey", "測量業務"], ["aerial", "航空・船舶関係"], ["geology", "地質業務"]], "4業務タブを指定順で表示する");
assert.ok(html.includes('id="consultingView" class="view active"') && !html.includes('id="estimateView" class="view active"'), "初期画面を設計業務にする");
for (const source of ["data/prefectures.js", "data/master-catalog.json", "data/official-source-catalog.json", "data/master-r8.js", "data/national-standard-masters.js", "data/verified-masters.js", "data/official-role-prices.js", "data/verified-work-item-expansions.js", "engine.js", "app.js", "analytics.js", "styles.css", "DISCLAIMER.md"]) {
  assert.ok(fs.existsSync(path.join(root, source)), `${source} が存在する`);
}
assert.ok(html.includes('id="travelMode"'), "旅費交通費モード選択がある");
assert.ok(app.includes("line-condition"), "水面幅条件入力が結線されている");
assert.ok(app.includes("line-rule"), "規定変化率選択が結線されている");
assert.ok(app.includes("line-manual-price"), "個別単価入力が結線されている");
assert.ok(app.includes('class="line-code table-item-select"') && app.includes('classList.contains("line-code")'), "追加済み作業項目をクリックして変更できる");
assert.ok(app.includes("line.correctionSelections = {}") && app.includes("line.manualUnitPrice = 0"), "作業項目変更時に旧項目固有の補正と手動単価を引き継がない");
assert.ok(app.includes("calc-detail"), "項目ごとの計算根拠表示がある");
assert.ok(html.includes('id="validationPanel"'), "提出前チェックがある");
assert.ok(html.includes('id="jurisdictionSelect"'), "積算地域を選択できる");
assert.ok(html.includes('id="fiscalYearSelect"'), "積算年度を選択できる");
assert.ok(html.includes('id="checkMasterUpdatesButton"'), "年度マスターの更新を確認できる");
assert.ok(html.includes('id="masterCoverageStatus"'), "国と47都道府県の収録状況を明示する");
assert.ok(!html.includes('id="officialRateYear"'), "技術者単価だけを入れ替える比較UIを表示しない");
assert.ok(!html.includes("比較用"), "利用者画面に比較マスターを表示しない");
assert.ok(app.includes("checkForMasterUpdates({ silent: true })"), "公開版起動時に検証済みマスターの更新を確認する");
assert.ok(app.includes("sha256Hex"), "配信マスターのSHA-256を検証する");
assert.ok(html.includes('src="data/verified-masters.js'), "ローカルファイル版でも広島県の検証済み年度マスターを読み込む");
assert.ok(app.includes("window.SEKISAN_VERIFIED_MASTERS"), "初期収録した検証済み年度マスターを地域・年度選択へ追加する");
assert.ok(html.includes('src="data/national-standard-masters.js'), "全国標準R6-R8をローカル版へ収録する");
assert.ok(app.includes("prefectureReferenceMasters"), "全国標準から47都道府県向け参考マスターを構成する");
assert.ok(app.includes('verificationStatus: "standard-reference"'), "県独自差分未確認版を検証済みと誤表示しない");
assert.ok(app.includes("県独自差分は未確認"), "全国標準参考の提出前警告を表示する");
assert.ok(!app.includes("（マスター未収録）"), "未確認県も全国標準参考で選択可能にする");
assert.ok(nationalMasters.includes("https://www.mlit.go.jp/tec/gyoumu_sekisan.html"), "全国標準に国交省積算基準の公式出典を収録する");
assert.ok(nationalMasters.includes("https://www.mlit.go.jp/tec/content/001724089.pdf"), "全国標準R6に公式技術者単価を収録する");
assert.ok(app.includes("function sourceListHtml"), "マスター画面と帳票で公式出典をリンク表示する");
assert.ok(html.includes("発注機関"), "国と都道府県を発注機関として選択する");
assert.ok(app.includes("blockInvalidQuantityKey"), "整数数量への小数キー入力を防止する");
assert.ok(app.includes("blockInvalidQuantityPaste"), "不正な桁数の貼り付けを防止する");
assert.ok(app.includes("normalizeQuantityInput"), "数量を単位別規則に正規化する");
assert.ok(app.includes("aerialShipCategories") && app.includes("surveyItemsForScope"), "測量と航空・船舶の作業項目をタブ別に分ける");
assert.ok(html.includes('id="surveyScopeNote"') && app.includes("深浅測量、空中写真測量、航空レーザ測量、UAV写真点群測量、地上レーザ測量、UAVレーザ測量"), "航空・船舶の収録分類と案件条件を画面で明示する");
assert.ok(app.includes("applyVerifiedWorkItemExpansions") && html.includes("data/verified-work-item-expansions.js?v="), "令和8年度UAVレーザの公式詳細工程を年度マスターへ展開する");
assert.ok(html.includes('id="reportView"'), "提出用帳票の設定画面がある");
assert.ok(html.includes('id="printDocument"'), "画面とは独立した印刷専用文書がある");
for (const section of ["quote", "summary", "breakdown", "unitDetail", "conditions"]) {
  assert.ok(html.includes(`data-section="${section}"`), `${section}帳票を選択できる`);
}
for (const renderer of ["renderQuoteReport", "renderSummaryReport", "renderBreakdownReport", "renderUnitDetailReport", "renderConditionsReport"]) {
  assert.ok(app.includes(`function ${renderer}`), `${renderer}が実装されている`);
}
assert.ok(app.includes('window.addEventListener("beforeprint"') && app.includes('dataset.mode !== "consulting"') && app.includes("renderPrintDocument()"), "印刷直前に帳票種別を守って最新結果から再生成する");
assert.ok(css.includes("@page { size: A4 portrait"), "A4縦のページ設定がある");
assert.ok(css.includes("table-header-group"), "複数ページで表頭を繰り返す設定がある");
assert.ok(css.includes(".workspace-main, .master-layout { display: grid; min-width: 0;"), "狭い画面で積算表がページ全体を横へ押し出さない");
assert.ok(css.includes("html, body { overflow-x: clip; }"), "表とタブの横スクロールをページ内に封じる");
assert.ok(css.includes(".table-scroll { max-width: 100%; overflow-x: auto; contain: layout paint; }"), "横長表のレイアウトと描画範囲をスクロール枠内に封じる");
assert.ok(css.includes(".view-tabs { overflow-x: visible; flex-wrap: wrap;"), "スマートフォン幅では画面切替タブを2段に折り返す");
assert.ok(html.includes('id="draftRecoveryPanel"'), "前回データの復元案内がある");
assert.ok(html.includes('id="restoreDraftButton"'), "前回データを明示操作で復元できる");
assert.ok(html.includes('id="dismissDraftButton"'), "新規画面のまま続けられる");
assert.ok(app.includes("let recoverableDraft = loadSavedEstimate();"), "起動時に前回データの有無だけ確認する");
assert.ok(app.includes("let estimate = emptyEstimate();"), "起動時の入力画面は必ず新規である");
assert.ok(!app.includes("let estimate = loadEstimate();"), "起動時に前回データを自動表示しない");
assert.ok(app.includes("function restoreSavedDraft()"), "明示操作による復元処理がある");
assert.ok(app.includes("if (sessionDirty) persistEstimate();"), "未操作の新規画面で前回保存を上書きしない");
assert.ok(html.includes("<h3>制作</h3>") && html.includes("株式会社アイズ測量"), "統合案内に制作者を表示する");
assert.ok(html.includes("Ez積算"), "Ez Viewer型の製品名を画面に表示する");
assert.ok(html.includes("https://ofuse.me/f475dafe/letter"), "確認済みOFUSE応援先を表示する");
assert.ok(html.includes('id="publisherInfoButton"'), "フッターのEz積算から統合案内を開ける");
assert.ok(app.includes('["aboutToolButton", "publisherInfoButton"]'), "ナビの免責ボタンとフッターを同じ案内へ結線する");
assert.ok(!html.includes('class="reference-notice') && !css.includes(".reference-notice"), "大きな参考試算注意帯を表示しない");
assert.ok(html.includes('>使い方・計算根拠</button>\n      <button id="aboutToolButton"') && html.includes("参考試算・免責</button>"), "使い方・計算根拠の右側に小さな免責ボタンを置く");
assert.ok(html.includes("ゲストとして送信"), "OFUSEのゲスト送信方法を案内する");
assert.ok(html.includes('id="aboutToolDialog"'), "免責・利用条件を画面で確認できる");
assert.ok(html.includes("応援のご案内") && html.includes("利用条件・免責事項") && html.includes("プライバシー・アクセス解析"), "制作・応援・免責・プライバシーを1画面に統合する");
assert.ok(!html.includes('id="supportDialog"') && !html.includes('id="footerSupportButton"') && !html.includes('id="footerAboutToolButton"'), "重複したフッター導線と別ダイアログを残さない");
assert.ok(!app.includes("openSupportDialog") && !app.includes('$("supportDialog")'), "廃止した応援専用ダイアログへ結線しない");
assert.ok(html.includes("公式の積算ソフト、発注機関の認定製品または公式帳票ではありません"), "免責ダイアログで非公式性を説明する");
assert.ok(app.includes("参考試算・公式資料要照合"), "印刷帳票にも照合注意を表示する");
assert.ok(!html.includes('id="analyticsConsent"') && !html.includes('id="analyticsAcceptButton"') && !html.includes('id="analyticsDeclineButton"'), "アクセス解析の同意ポップアップを表示しない");
assert.ok(!html.includes('id="analyticsSettingsButton"') && !analytics.includes("readConsent") && !analytics.includes("writeConsent"), "アクセス解析の同意保存と設定変更UIを残さない");
assert.ok(!html.includes("サイト改善のため") && !html.includes("利用状況の把握と改善のため"), "アクセス解析の目的説明を画面へ表示しない");
assert.ok(!html.includes("概略地域、ブラウザー・端末情報"), "アクセス解析の詳細列挙を画面へ表示しない");
assert.ok(html.includes('href="styles.css?v=') && html.includes('src="app.js?v='), "公開時にCSSとアプリJSの旧キャッシュを再利用しない");
assert.ok(analytics.includes('const measurementId = "G-88B9YPJXWP"'), "既存Ezアイズ製品と同じGA4測定IDを使う");
assert.ok(analytics.includes('location.protocol !== "https:"'), "公開HTTPS版以外では解析を送信しない");
assert.ok(analytics.includes('analytics_storage: "granted"') && analytics.includes('send_page_view: true'), "公開HTTPS版ではページアクセス解析を常時開始する");
assert.ok(analytics.includes('ad_storage: "denied"'), "広告用保存は拒否する");
assert.ok(!app.includes("gtag("), "積算アプリから入力値をAnalyticsイベントへ送らない");

console.log("OK: UI static wiring checks passed");
