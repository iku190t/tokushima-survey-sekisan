(function () {
  "use strict";

  const app = window.EzSekisanApp;
  const master = window.CONSULTING_MASTER;
  const engine = window.ConsultingEngine;
  const pricesByYear = window.OFFICIAL_ROLE_PRICES;
  if (!app || !master || !engine || !pricesByYear) return;

  const $ = (id) => document.getElementById(id);
  const h = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const money = (value) => `¥${Math.floor(Number(value) || 0).toLocaleString("ja-JP")}`;
  const service = (id) => master.serviceTypes.find((entry) => entry.id === id) || master.serviceTypes[0];
  const roleDefinition = (serviceType, roleId) => master.roleGroups[service(serviceType).roleGroup].find((entry) => entry.id === roleId);
  let activeConsultingScope = "design";

  function serviceInScope(entry) {
    return activeConsultingScope === "geology"
      ? ["geologyAnalysis", "geologyGeneral"].includes(entry.id)
      : ["design", "planning"].includes(entry.id);
  }

  function scopedServices() {
    return master.serviceTypes.filter(serviceInScope);
  }

  function renderScopeLabels() {
    const geology = activeConsultingScope === "geology";
    $("consultingScopeTitle").textContent = geology ? "地質業務の年度別技術者単価と計算方式" : "設計業務の年度別技術者単価と計算方式";
    $("consultingScopeDescription").textContent = geology
      ? "地質解析は設計方式、地質一般調査は地質調査方式で別計算します。機械・材料・運搬・仮設等は案件条件を確認してください。"
      : "土木設計・調査計画を設計方式で計算します。歩掛を確認できない作業の人工は自動推定しません。";
    $("consultingAddHeading").textContent = geology ? "地質業務の詳細項目・人工を追加" : "設計業務の詳細項目・人工を追加";
    $("consultingDetailHeading").textContent = geology ? "地質業務の職種別内訳" : "設計業務の職種別内訳";
    $("consultingEmptyText").textContent = geology ? "地質業務の業務区分、詳細項目、職種、人工を選んで追加します。" : "設計業務の業務区分、詳細項目、職種、人工を選んで追加します。";
  }

  function state() {
    const estimate = app.getEstimate();
    if (!estimate.consulting) {
      estimate.consulting = { schemaVersion: 1, fiscalYear: 2026, lines: [], costs: {}, options: {} };
    }
    estimate.consulting.lines = Array.isArray(estimate.consulting.lines) ? estimate.consulting.lines : [];
    estimate.consulting.costs = Object.assign({ designDirectExpenses: 0, geologyDirectNonLabor: 0, geologyIndirect: 0, geologyExcluded: 0 }, estimate.consulting.costs || {});
    estimate.consulting.options = Object.assign({ includeSurvey: false, electronicMode: "none", adjustBusinessPrice: false, taxRate: 0.1 }, estimate.consulting.options || {});
    if (!master.supportedYears.includes(Number(estimate.consulting.fiscalYear))) estimate.consulting.fiscalYear = master.supportedYears[0];
    return estimate.consulting;
  }

  function rolePrices() {
    return pricesByYear[state().fiscalYear]?.roles || {};
  }

  function currentResult() {
    const survey = app.getSurveyResult();
    return engine.calculateEstimate(state(), master, rolePrices(), survey?.totals?.businessPrice || 0);
  }

  function renderYearAndProject() {
    const current = state();
    $("consultingFiscalYear").innerHTML = master.supportedYears.map((year) => `<option value="${year}">令和${year - 2018}年度</option>`).join("");
    $("consultingFiscalYear").value = current.fiscalYear;
    $("consultingProjectName").value = app.getEstimate().projectName || "";
    const surveyMaster = app.getActiveSurveyMaster();
    $("consultingAuthorityText").textContent = app.getSubmissionJurisdictionName?.() || "見積提出先未設定";
    $("consultingBasisText").textContent = `令和${current.fiscalYear - 2018}年度・国交省全国一律技術者単価`;
  }

  function renderServiceControls(resetTask = false) {
    const availableServices = scopedServices();
    const previousService = $("consultingServiceType").value || availableServices[0].id;
    $("consultingServiceType").innerHTML = availableServices.map((entry) => `<option value="${h(entry.id)}">${h(entry.name)}</option>`).join("");
    $("consultingServiceType").value = availableServices.some((entry) => entry.id === previousService) ? previousService : availableServices[0].id;
    const selectedService = service($("consultingServiceType").value);
    const tasks = master.taskNames[selectedService.id] || ["任意作業"];
    const previousTask = $("consultingTaskTemplate").value;
    $("consultingTaskTemplate").innerHTML = tasks.map((task) => `<option>${h(task)}</option>`).join("");
    if (!resetTask && tasks.includes(previousTask)) $("consultingTaskTemplate").value = previousTask;
    if (resetTask || !$("consultingTaskName").value) $("consultingTaskName").value = $("consultingTaskTemplate").value;
    const roles = master.roleGroups[selectedService.roleGroup];
    const previousRole = $("consultingRole").value;
    $("consultingRole").innerHTML = roles.map((role) => `<option value="${h(role.id)}">${h(role.name)}</option>`).join("");
    if (roles.some((role) => role.id === previousRole)) $("consultingRole").value = previousRole;
    renderRoleMeta();
  }

  function renderRoleMeta() {
    const role = roleDefinition($("consultingServiceType").value, $("consultingRole").value);
    const price = rolePrices()[$("consultingRole").value] || 0;
    $("consultingRoleMeta").textContent = `${role?.name || "職種未選択"}：基準日額 ${money(price)}／人日。人工は合計所要人日を小数第3位まで入力します。`;
  }

  function renderPresets() {
    const presets = master.verifiedPresets.filter((preset) => scopedServices().some((entry) => entry.id === preset.serviceType));
    $("consultingPreset").innerHTML = presets.length
      ? presets.map((preset) => `<option value="${h(preset.id)}">${h(preset.label)}｜${h(preset.source)}</option>`).join("")
      : '<option value="">この業務区分の確認済み歩掛は未収録</option>';
    $("addConsultingPresetButton").disabled = presets.length === 0;
  }

  function renderLines(result) {
    const current = state();
    const visibleLines = result.lines.filter((line) => scopedServices().some((entry) => entry.id === line.serviceType));
    $("consultingEmptyState").hidden = visibleLines.length > 0;
    $("consultingLineBody").innerHTML = visibleLines.map((line) => {
      const role = roleDefinition(line.serviceType, line.role);
      const sourceLine = current.lines.find((entry) => entry.id === line.id);
      const source = sourceLine?.verifiedSource;
      const imported = sourceLine?.importSource;
      return `<tr data-consulting-line="${h(line.id)}">
        <td><strong>${h(line.taskName)}</strong><small>${h(line.serviceName)}${source ? `／確認済み：${h(source)}` : imported ? `／資料取込：${h(imported.fileName || "貼付け原文")} p.${h(imported.page || 1)}（要原文照合）` : "／人工入力"}</small></td>
        <td>${h(role?.name || line.role)}</td>
        <td><input class="consulting-line-days" type="number" min="0" step="0.001" value="${h(line.days)}"><span class="input-unit">人日</span></td>
        <td>${money(line.dailyRate)}</td><td><strong>${money(line.amount)}</strong></td>
        <td class="no-print"><button class="icon-button danger-text delete-consulting-line" type="button" aria-label="削除">×</button></td>
      </tr>`;
    }).join("");
  }

  function renderCostsAndOptions() {
    const current = state();
    document.querySelectorAll(".consulting-cost").forEach((input) => { input.value = current.costs[input.dataset.cost] || ""; });
    $("consultingElectronicMode").value = current.options.electronicMode;
    $("consultingIncludeSurvey").checked = Boolean(current.options.includeSurvey);
    $("consultingAdjustBusinessPrice").checked = Boolean(current.options.adjustBusinessPrice);
    $("consultingTaxRate").value = (Number(current.options.taxRate || 0) * 100).toFixed(1).replace(".0", "");
  }

  function validationIssues(result) {
    const issues = [];
    const current = state();
    if (!result.lines.length) issues.push("人工内訳がありません。作業・職種・人工を追加してください。");
    if (result.lines.some((line) => !line.dailyRate)) issues.push("基準日額が0円の職種があります。年度単価を確認してください。");
    if (result.lines.some((line) => line.calculationSystem === "geology") && !current.costs.geologyDirectNonLabor && !current.costs.geologyIndirect) issues.push("地質一般調査の機械・材料・運搬・仮設等が0円です。不要か未入力か確認してください。");
    if (current.options.includeSurvey && !app.getSurveyResult().lines.length) issues.push("測量積算を合算する設定ですが、測量作業項目がありません。");
    if (result.lines.some((line) => !current.lines.find((entry) => entry.id === line.id)?.verifiedSource)) issues.push("人工入力の行があります。採用歩掛と数量条件を積算基準・特記仕様書で照合してください。");
    return issues;
  }

  function renderSummary(result) {
    const t = result.totals;
    const rows = [
      ["測量業務価格（合算時）", t.surveyBusinessPrice],
      ["設計等・直接人件費", t.designLabor],
      ["設計等・積上直接経費", t.designDirectExpenses + t.electronic],
      ["設計等・その他原価", t.otherCost],
      ["設計等・一般管理費等", t.generalManagement],
      ["設計等業務価格", t.designBusinessPrice, true],
      ["地質一般・対象額", t.geologyTarget],
      ["地質一般・諸経費", t.geologyOverhead],
      ["地質一般業務価格", t.geologyBusinessPrice, true],
      ["総合業務価格", t.businessPrice, true],
      [`消費税（${(t.taxRate * 100).toFixed(1).replace(".0", "")}%）`, t.tax]
    ];
    $("consultingSummaryList").innerHTML = rows.map(([label, value, strong]) => `<div${strong ? ' class="strong-row"' : ""}><dt>${h(label)}</dt><dd>${money(value)}</dd></div>`).join("");
    $("consultingTotalAmount").textContent = money(t.total);
    $("consultingGeologyRate").textContent = t.geologyTarget ? `${t.geologyOverheadRate.toFixed(1)}%` : "—";
    const issues = validationIssues(result);
    $("consultingValidationList").innerHTML = issues.length ? issues.map((issue) => `<li>${h(issue)}</li>`).join("") : "<li>自動検査範囲では未入力警告はありません。案件固有条件を最終照合してください。</li>";
  }

  function renderSources() {
    const yearSource = pricesByYear[state().fiscalYear];
    const sources = [{ label: yearSource.sourceLabel, url: yearSource.sourceUrl }, ...master.sources];
    $("consultingSourceList").innerHTML = sources.map((source) => `<li><a href="${h(source.url)}" target="_blank" rel="noopener noreferrer">${h(source.label)}</a></li>`).join("");
  }

  function renderAll() {
    renderScopeLabels();
    renderYearAndProject();
    renderServiceControls(false);
    renderPresets();
    renderCostsAndOptions();
    renderSources();
    const result = currentResult();
    renderLines(result);
    renderSummary(result);
  }

  function updateAndRender() {
    app.saveDraft();
    const result = currentResult();
    renderLines(result);
    renderSummary(result);
    renderRoleMeta();
  }

  function addLine() {
    const current = state();
    const selectedService = service($("consultingServiceType").value);
    const role = $("consultingRole").value;
    const days = engine.normalizeDays($("consultingDays").value);
    if (!days) { app.notify("人工を0より大きい値で入力してください"); return; }
    current.lines.push({ id: `consult-${Date.now()}-${Math.random().toString(16).slice(2)}`, serviceType: selectedService.id, taskName: $("consultingTaskName").value.trim() || $("consultingTaskTemplate").value, role, days });
    updateAndRender();
    app.notify(`${activeConsultingScope === "geology" ? "地質" : "設計"}業務の人工を追加しました`);
  }

  function addPreset() {
    const preset = master.verifiedPresets.find((entry) => entry.id === $("consultingPreset").value);
    if (!preset) return;
    Object.entries(preset.roles).forEach(([role, days]) => state().lines.push({ id: `consult-${Date.now()}-${role}`, serviceType: preset.serviceType, taskName: preset.label, role, days, verifiedSource: preset.source }));
    updateAndRender();
    app.notify("確認済み標準歩掛を追加しました");
  }

  function importCandidates(detail) {
    const current = state();
    let added = 0;
    let rejected = 0;
    (Array.isArray(detail?.lines) ? detail.lines : []).forEach((entry) => {
      const selectedService = master.serviceTypes.find((candidate) => candidate.id === entry.serviceType);
      const roles = selectedService ? master.roleGroups[selectedService.roleGroup] || [] : [];
      if (!selectedService || !roles.some((role) => role.id === entry.role)) { rejected += 1; return; }
      const days = engine.normalizeDays(entry.days);
      if (!(days > 0)) { rejected += 1; return; }
      current.lines.push({
        id: `consult-import-${Date.now()}-${added}-${Math.random().toString(16).slice(2)}`,
        serviceType: selectedService.id,
        taskName: String(entry.taskName || "資料取込作業").trim().slice(0, 120) || "資料取込作業",
        role: entry.role,
        days,
        importSource: {
          fileName: String(entry.fileName || detail.fileName || "").slice(0, 180),
          page: Math.max(1, Math.floor(Number(entry.page) || 1)),
          method: entry.method === "ocr" ? "ocr" : "text",
          confidence: ["high", "medium", "low"].includes(entry.confidence) ? entry.confidence : "low"
        }
      });
      added += 1;
    });
    Object.entries(detail?.costs || {}).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(current.costs, key) && Number(value) >= 0) current.costs[key] = Math.floor(Number(value));
    });
    if (detail?.includeSurvey) current.options.includeSurvey = true;
    if (added || Object.keys(detail?.costs || {}).length) updateAndRender();
    detail.result = { added, rejected };
  }

  function renderPrintDocument(result) {
    const estimate = app.getEstimate();
    const current = state();
    const t = result.totals;
    const issueDate = estimate.date ? estimate.date.replace(/-/g, "/") : "—";
    const authority = app.getSubmissionJurisdictionName?.() || "—";
    const rows = result.lines.map((line, index) => `<tr><td>${index + 1}</td><td>${h(line.serviceName)}</td><td>${h(line.taskName)}</td><td>${h(roleDefinition(line.serviceType, line.role)?.name || line.role)}</td><td>${h(line.days)}</td><td>${money(line.dailyRate)}</td><td>${money(line.amount)}</td></tr>`).join("");
    const sourceRows = [{ label: pricesByYear[current.fiscalYear].sourceLabel, url: pricesByYear[current.fiscalYear].sourceUrl }, ...master.sources].map((source) => `<li>${h(source.label)}<br><small>${h(source.url)}</small></li>`).join("");
    const header = (title) => `<header class="report-page-header"><div><p>測量・調査・設計業務 提出用帳票</p><h1>${h(title)}</h1><span>令和${current.fiscalYear - 2018}年度／${h(authority)}</span></div><div class="report-header-meta"><span>${h(issueDate)}</span></div></header>`;
    const footer = (label) => `<footer class="report-page-footer"><span>${h(estimate.projectName || "総合業務積算")}</span><span>参考試算・公式資料要照合 ／ ${h(label)}</span></footer>`;
    const info = estimate.projectInfo || {};
    const projectRows = [["業務名", estimate.projectName], ["発注者", info.orderingParty], ["担当部署", info.department], ["担当者", info.contactName], ["業務場所", info.workLocation], ["履行期間", info.contractPeriod], ["文書・業務番号", info.documentNumber], ["公告・資料日", info.documentDate], ["積算日", issueDate]]
      .filter(([, value]) => String(value || "").trim()).map(([label, value]) => `<div><dt>${h(label)}</dt><dd>${h(value)}</dd></div>`).join("");
    const summaryRows = [
      ["測量業務価格", t.surveyBusinessPrice], ["設計・調査計画・解析業務価格", t.designBusinessPrice], ["地質一般調査業務価格", t.geologyBusinessPrice], ["総合業務価格", t.businessPrice], ["消費税", t.tax], ["税込合計", t.total]
    ].map(([label, value], index) => `<tr${index >= 3 ? ' class="total-row"' : ""}><td>${h(label)}</td><td>${money(value)}</td></tr>`).join("");
    const pages = `<section class="report-page">${header("総 合 積 算 総 括 表")}<dl class="report-project-meta">${projectRows}</dl><table class="report-table summary-report-table"><thead><tr><th>業務区分</th><th>金額</th></tr></thead><tbody>${summaryRows}</tbody></table><p class="report-caption">地質一般調査諸経費率：${t.geologyTarget ? `${t.geologyOverheadRate.toFixed(1)}%` : "—"} ／ 総合業務価格調整：${money(t.adjustment)}</p>${footer("総合積算総括表")}</section>
      <section class="report-page report-long-table">${header("業 務 費 内 訳 書")}<table class="report-table breakdown-report-table"><thead><tr><th>No.</th><th>業務区分</th><th>作業</th><th>職種</th><th>人工</th><th>日額</th><th>人件費</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="empty-report-cell">人工内訳がありません</td></tr>'}</tbody></table><section class="report-note-block"><h2>積上げ費用</h2><p>設計等直接経費 ${money(t.designDirectExpenses)}／電子成果品 ${money(t.electronic)}／地質直接調査費（人件費以外） ${money(t.geologyDirectNonLabor)}／地質間接調査費 ${money(t.geologyIndirect)}／諸経費対象外 ${money(t.geologyExcluded)}</p></section><section class="report-note-block source-note"><h2>出典</h2><ul>${sourceRows}</ul></section><p class="report-disclaimer"><strong>参考試算用・公式帳票ではありません。</strong> 人工入力行、市場単価、機械・材料、運搬・仮設、旅費、特記仕様、発注機関の端数運用を最新の公式資料と照合してください。</p>${footer("業務費内訳書")}</section>`;
    const printDocument = $("printDocument");
    printDocument.dataset.mode = "consulting";
    printDocument.innerHTML = pages;
  }

  function printCombined() {
    const result = currentResult();
    renderPrintDocument(result);
    document.title = `${app.safeName()}_総合積算内訳`;
    window.print();
  }

  function bindEvents() {
    $("consultingServiceType").addEventListener("change", () => renderServiceControls(true));
    $("consultingTaskTemplate").addEventListener("change", () => { $("consultingTaskName").value = $("consultingTaskTemplate").value; });
    $("consultingRole").addEventListener("change", renderRoleMeta);
    $("consultingFiscalYear").addEventListener("change", (event) => { state().fiscalYear = Number(event.target.value); renderAll(); app.saveDraft(); });
    $("consultingProjectName").addEventListener("input", (event) => { app.getEstimate().projectName = event.target.value; $("projectName").value = event.target.value; app.saveDraft(); });
    $("projectName").addEventListener("input", () => { $("consultingProjectName").value = $("projectName").value; });
    $("addConsultingLineButton").addEventListener("click", addLine);
    $("addConsultingPresetButton").addEventListener("click", addPreset);
    document.querySelectorAll(".consulting-cost").forEach((input) => input.addEventListener("input", (event) => { state().costs[event.target.dataset.cost] = Math.max(0, Math.floor(Number(event.target.value) || 0)); updateAndRender(); }));
    $("consultingElectronicMode").addEventListener("change", (event) => { state().options.electronicMode = event.target.value; updateAndRender(); });
    $("consultingIncludeSurvey").addEventListener("change", (event) => { state().options.includeSurvey = event.target.checked; updateAndRender(); });
    $("consultingAdjustBusinessPrice").addEventListener("change", (event) => { state().options.adjustBusinessPrice = event.target.checked; updateAndRender(); });
    $("consultingTaxRate").addEventListener("input", (event) => { state().options.taxRate = Math.max(0, Number(event.target.value) || 0) / 100; updateAndRender(); });
    $("consultingLineBody").addEventListener("change", (event) => {
      const row = event.target.closest("tr[data-consulting-line]");
      const line = state().lines.find((entry) => entry.id === row?.dataset.consultingLine);
      if (line && event.target.classList.contains("consulting-line-days")) line.days = engine.normalizeDays(event.target.value);
      updateAndRender();
    });
    $("consultingLineBody").addEventListener("click", (event) => {
      const button = event.target.closest(".delete-consulting-line");
      if (!button) return;
      const row = button.closest("tr[data-consulting-line]");
      state().lines = state().lines.filter((line) => line.id !== row.dataset.consultingLine);
      updateAndRender();
    });
    $("consultingPrintButton").addEventListener("click", printCombined);
    document.addEventListener("ezsekisan:estimatechange", renderAll);
    document.addEventListener("ezsekisan:businessscope", (event) => {
      if (!["design", "geology"].includes(event.detail?.scope)) return;
      activeConsultingScope = event.detail.scope;
      renderAll();
    });
    document.addEventListener("ezsekisan:consultingimport", (event) => importCandidates(event.detail || {}));
    window.addEventListener("afterprint", () => { delete $("printDocument").dataset.mode; });
  }

  bindEvents();
  renderAll();
})();
