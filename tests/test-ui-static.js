"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const analytics = fs.readFileSync(path.join(root, "analytics.js"), "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const referenced = new Set([...app.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]));
const missing = [...referenced].filter((id) => !ids.has(id));

assert.deepStrictEqual(missing, [], `app.jsから参照されるHTML要素が不足: ${missing.join(", ")}`);
for (const source of ["data/master-r8.js", "data/official-role-prices.js", "engine.js", "app.js", "analytics.js", "styles.css", "DISCLAIMER.md"]) {
  assert.ok(fs.existsSync(path.join(root, source)), `${source} が存在する`);
}
assert.ok(html.includes('id="travelMode"'), "旅費交通費モード選択がある");
assert.ok(app.includes("line-condition"), "水面幅条件入力が結線されている");
assert.ok(app.includes("line-rule"), "規定変化率選択が結線されている");
assert.ok(app.includes("line-manual-price"), "個別単価入力が結線されている");
assert.ok(app.includes("calc-detail"), "項目ごとの計算根拠表示がある");
assert.ok(html.includes('id="validationPanel"'), "提出前チェックがある");
assert.ok(html.includes('id="officialRateYear"'), "過去5年の公式技術者単価切替がある");
assert.ok(app.includes("blockInvalidQuantityKey"), "整数数量への小数キー入力を防止する");
assert.ok(app.includes("blockInvalidQuantityPaste"), "不正な桁数の貼り付けを防止する");
assert.ok(app.includes("normalizeQuantityInput"), "数量を単位別規則に正規化する");
assert.ok(html.includes('id="reportView"'), "提出用帳票の設定画面がある");
assert.ok(html.includes('id="printDocument"'), "画面とは独立した印刷専用文書がある");
for (const section of ["quote", "summary", "breakdown", "unitDetail", "conditions"]) {
  assert.ok(html.includes(`data-section="${section}"`), `${section}帳票を選択できる`);
}
for (const renderer of ["renderQuoteReport", "renderSummaryReport", "renderBreakdownReport", "renderUnitDetailReport", "renderConditionsReport"]) {
  assert.ok(app.includes(`function ${renderer}`), `${renderer}が実装されている`);
}
assert.ok(app.includes('window.addEventListener("beforeprint", renderPrintDocument)'), "印刷直前に最新の積算結果から帳票を再生成する");
assert.ok(css.includes("@page { size: A4 portrait"), "A4縦のページ設定がある");
assert.ok(css.includes("table-header-group"), "複数ページで表頭を繰り返す設定がある");
assert.ok(css.includes(".workspace-main, .master-layout { display: grid; min-width: 0;"), "狭い画面で積算表がページ全体を横へ押し出さない");
assert.ok(css.includes("html { color-scheme: light; overflow-x: hidden; }"), "表とタブの横スクロールをページ内に封じる");
assert.ok(html.includes('id="draftRecoveryPanel"'), "前回データの復元案内がある");
assert.ok(html.includes('id="restoreDraftButton"'), "前回データを明示操作で復元できる");
assert.ok(html.includes('id="dismissDraftButton"'), "新規画面のまま続けられる");
assert.ok(app.includes("let recoverableDraft = loadSavedEstimate();"), "起動時に前回データの有無だけ確認する");
assert.ok(app.includes("let estimate = emptyEstimate();"), "起動時の入力画面は必ず新規である");
assert.ok(!app.includes("let estimate = loadEstimate();"), "起動時に前回データを自動表示しない");
assert.ok(app.includes("function restoreSavedDraft()"), "明示操作による復元処理がある");
assert.ok(app.includes("if (sessionDirty) persistEstimate();"), "未操作の新規画面で前回保存を上書きしない");
assert.ok(html.includes("制作：株式会社アイズ測量"), "制作者を画面に表示する");
assert.ok(html.includes("Ezアイズ Survey Tools"), "ツールブランドを画面に表示する");
assert.ok(html.includes("https://ofuse.me/f475dafe/letter"), "確認済みOFUSE応援先を表示する");
assert.ok(html.includes('id="aboutToolDialog"'), "免責・利用条件を画面で確認できる");
assert.ok(html.includes("参考試算用・公式ソフトではありません"), "公式ソフトではないことを常時表示する");
assert.ok(app.includes("参考試算・公式資料要照合"), "印刷帳票にも照合注意を表示する");
assert.ok(html.includes('id="analyticsConsent"'), "アクセス解析の同意UIがある");
assert.ok(analytics.includes('const measurementId = "G-88B9YPJXWP"'), "既存Ezアイズ製品と同じGA4測定IDを使う");
assert.ok(analytics.includes('location.protocol === "file:"'), "ローカルファイル実行時は解析を送信しない");
assert.ok(analytics.includes('analytics_storage: "granted"'), "同意後だけAnalytics保存を許可する");
assert.ok(analytics.includes('ad_storage: "denied"'), "広告用保存は拒否する");
assert.ok(!app.includes("gtag("), "積算アプリから入力値をAnalyticsイベントへ送らない");

console.log("OK: UI static wiring checks passed");
