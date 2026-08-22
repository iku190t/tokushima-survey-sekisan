(function () {
  "use strict";

  const app = window.EzSekisanApp;
  const reader = window.DocumentReader;
  const analyzer = window.DocumentImportEngine;
  const consultingMaster = window.CONSULTING_MASTER;
  if (!app || !reader || !analyzer || !consultingMaster) return;

  const $ = (id) => document.getElementById(id);
  const h = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const confidenceLabel = (value) => value === "high" ? "確信度：高" : value === "medium" ? "確信度：要確認" : "確信度：低";
  const methodLabel = (value) => value === "ocr" ? "OCR" : "PDF文字抽出";
  let currentAnalysis = null;
  let currentFileName = "";
  let running = false;

  function activeMaster() { return app.getActiveSurveyMaster(); }
  function serviceById(id) { return consultingMaster.serviceTypes.find((entry) => entry.id === id) || consultingMaster.serviceTypes[0]; }
  function rolesFor(serviceType) { return consultingMaster.roleGroups[serviceById(serviceType).roleGroup] || []; }

  function updateProgress(status) {
    $("documentImportProgress").hidden = false;
    $("documentImportStatus").textContent = status.message || "解析しています…";
    const percent = status.progress == null ? 12 : Math.max(0, Math.min(100, Math.round(status.progress * 100)));
    $("documentImportProgressBar").style.width = `${percent}%`;
  }

  function surveyOptions(selectedCode) {
    return activeMaster().workItems.map((item) => `<option value="${h(item.code)}" ${item.code === selectedCode ? "selected" : ""}>${h(item.code)}｜${h(item.name)}</option>`).join("");
  }

  function serviceOptions(selectedId) {
    return consultingMaster.serviceTypes.map((service) => `<option value="${h(service.id)}" ${service.id === selectedId ? "selected" : ""}>${h(service.name)}</option>`).join("");
  }

  function roleOptions(serviceType, selectedId) {
    const roles = rolesFor(serviceType);
    const valid = roles.some((role) => role.id === selectedId) ? selectedId : roles[0]?.id;
    return roles.map((role) => `<option value="${h(role.id)}" ${role.id === valid ? "selected" : ""}>${h(role.name)}</option>`).join("");
  }

  function jurisdictionOptions(selectedCode) {
    return (window.SEKISAN_JURISDICTIONS || []).map((entry) => `<option value="${h(entry.code)}" ${entry.code === selectedCode ? "selected" : ""}>${h(entry.name)}</option>`).join("");
  }

  function metadataHtml(field) {
    const display = field.displayValue || field.value;
    const editor = field.key === "jurisdiction"
      ? `<select class="import-metadata-value" data-metadata-key="jurisdictionCode">${jurisdictionOptions(field.code)}</select>`
      : field.key === "fiscalYear"
        ? `<label class="mini-field">西暦年度 <input class="import-metadata-value" data-metadata-key="fiscalYear" type="number" min="2019" max="2100" step="1" value="${h(field.value)}"></label>`
        : `<input class="import-metadata-value" data-metadata-key="${h(field.key)}" type="text" value="${h(field.value)}" aria-label="${h(field.label)}">`;
    return `<article class="import-metadata-row" data-metadata-key="${h(field.key)}" data-confidence="${h(field.confidence)}" data-affects-calculation="${field.affectsCalculation ? "true" : "false"}"><input class="import-metadata-select" type="checkbox" ${field.selected ? "checked" : ""} aria-label="${h(field.label)}を反映"><div class="import-metadata-label"><strong>${h(field.label)}</strong><span>${h(methodLabel(field.method))}／p.${h(field.page)}</span></div>${editor}<div class="import-metadata-source"><q>${h(field.sourceText || display)}</q></div><span class="confidence-chip">${h(confidenceLabel(field.confidence))}</span></article>`;
  }

  function candidateHtml(candidate) {
    const commonStart = `<article class="import-candidate" data-candidate-id="${h(candidate.id)}" data-kind="${h(candidate.kind)}" data-confidence="${h(candidate.confidence)}"><input class="import-candidate-select" type="checkbox" ${candidate.selected ? "checked" : ""} aria-label="この候補を取り込む"><div class="import-candidate-type"><strong>${candidate.kind === "survey" ? "測量数量" : candidate.kind === "consulting" ? "設計・調査人工" : "積上費用"}</strong><span>${h(methodLabel(candidate.method))}／p.${h(candidate.page)}</span></div>`;
    const source = `<div class="import-candidate-source"><q>${h(candidate.sourceText)}</q></div><span class="confidence-chip">${h(confidenceLabel(candidate.confidence))}</span></article>`;
    if (candidate.kind === "survey") {
      const item = activeMaster().workItems.find((entry) => entry.code === candidate.code) || activeMaster().workItems[0];
      const rule = window.SekisanEngine.quantityRule(item, activeMaster());
      return `${commonStart}<div class="import-candidate-editor"><select class="import-survey-code">${surveyOptions(item?.code)}</select><label class="mini-field">数量 <input class="import-survey-quantity" type="number" min="${h(rule.min)}" step="${h(rule.step)}" value="${h(candidate.quantity)}"><span class="import-survey-unit">${h(item?.unit || "")}</span></label></div>${source}`;
    }
    if (candidate.kind === "consulting") {
      return `${commonStart}<div class="import-candidate-editor consulting-editor"><select class="import-consulting-service">${serviceOptions(candidate.serviceType)}</select><input class="import-consulting-task" type="text" value="${h(candidate.taskName)}" aria-label="作業名"><select class="import-consulting-role">${roleOptions(candidate.serviceType, candidate.role)}</select><label class="mini-field">人工 <input class="import-consulting-days" type="number" min="0" step="0.001" value="${h(candidate.days)}"></label></div>${source}`;
    }
    return `${commonStart}<div class="import-candidate-editor"><input class="import-cost-label" type="text" value="${h(candidate.label)}" disabled><label class="mini-field">金額 <input class="import-cost-amount" type="number" min="0" step="1" value="${h(candidate.amount)}">円</label><input class="import-cost-key" type="hidden" value="${h(candidate.costKey)}"></div>${source}`;
  }

  function updateSelectionState() {
    const candidateBoxes = [...document.querySelectorAll(".import-candidate-select")];
    const metadataBoxes = [...document.querySelectorAll(".import-metadata-select")];
    const candidateChecked = candidateBoxes.filter((box) => box.checked).length;
    const metadataChecked = metadataBoxes.filter((box) => box.checked).length;
    $("toggleAllImportCandidates").checked = candidateBoxes.length > 0 && candidateChecked === candidateBoxes.length;
    $("toggleAllImportCandidates").indeterminate = candidateChecked > 0 && candidateChecked < candidateBoxes.length;
    $("toggleAllImportMetadata").checked = metadataBoxes.length > 0 && metadataChecked === metadataBoxes.length;
    $("toggleAllImportMetadata").indeterminate = metadataChecked > 0 && metadataChecked < metadataBoxes.length;
    const checked = candidateChecked + metadataChecked;
    const hasResults = candidateBoxes.length + metadataBoxes.length > 0;
    const button = $("applyDocumentImportButton");
    button.dataset.action = hasResults ? "apply" : "close";
    button.disabled = hasResults && checked === 0;
    button.textContent = !hasResults ? "読み取れる項目なし・閉じる" : checked ? `確認した${checked}項目を反映` : "反映する項目を選択してください";
    $("cancelDocumentImportButton").hidden = !hasResults;
  }

  function renderReview(fileName, analysis) {
    currentFileName = fileName;
    currentAnalysis = analysis;
    const methods = [...new Set(analysis.pages.map((page) => methodLabel(page.method)))];
    $("importReviewFileName").textContent = fileName;
    $("importReviewMethods").textContent = methods.join("＋") || "原文貼付け";
    $("importReviewCount").textContent = `基本情報${analysis.metadata.fields.length}件＋積算${analysis.candidates.length}件`;
    const metadataCount = analysis.metadata.fields.length;
    const candidateCount = analysis.candidates.length;
    const hasResults = metadataCount + candidateCount > 0;
    $("documentImportMetadataList").innerHTML = analysis.metadata.fields.map(metadataHtml).join("");
    $("importMetadataPanel").hidden = metadataCount === 0;
    $("toggleAllImportMetadataLabel").hidden = metadataCount === 0;
    const master = activeMaster();
    const detected = [analysis.metadata.jurisdictionName, analysis.metadata.fiscalYear ? `令和${analysis.metadata.fiscalYear - 2018}年度` : ""].filter(Boolean).join("・");
    $("importedBasisHint").textContent = `${detected ? `資料候補：${detected}。` : "資料から発注機関・年度を確定できませんでした。"} 取込先：${master.jurisdictionName}・令和${master.fiscalYear - 2018}年度。取込先は自動変更しません。`;
    const warnings = [...analysis.warnings];
    if (analysis.metadata.fiscalYear && analysis.metadata.fiscalYear !== master.fiscalYear) warnings.push("資料の年度候補と現在の積算年度が異なります。閉じて年度マスターを切り替えてから再度確認してください。");
    if (analysis.metadata.jurisdictionCode && analysis.metadata.jurisdictionCode !== master.jurisdictionCode) warnings.push("資料の発注機関候補と現在の取込先が異なります。発注機関を確認してください。");
    $("documentImportWarnings").hidden = warnings.length === 0;
    $("documentImportWarnings").innerHTML = warnings.length ? `<ul>${warnings.map((warning) => `<li>${h(warning)}</li>`).join("")}</ul>` : "";
    $("documentImportCandidateList").innerHTML = analysis.candidates.map(candidateHtml).join("");
    $("importCandidateToolbar").hidden = candidateCount === 0;
    $("documentImportCandidateList").hidden = candidateCount === 0;
    const guide = $("documentImportEmptyGuide");
    guide.hidden = candidateCount > 0;
    guide.innerHTML = !hasResults
      ? "<strong>この資料から自動反映できる項目を見つけられませんでした。</strong><p>選択操作は不要です。下の抽出原文を確認し、「読み取れる項目なし・閉じる」を押してください。その後、上部の4業務タブから該当画面を開いて手入力できます。</p>"
      : "<strong>積算数量・人工は見つかりませんでした。</strong><p>上の業務基本情報だけ反映できます。内容とチェックを確認して、下の反映ボタンを押してください。数量は該当する業務タブから手入力してください。</p>";
    $("documentImportSourcePages").innerHTML = analysis.pages.map((page) => `<section class="import-source-page"><h3>${h(page.pageNumber)}ページ／${h(methodLabel(page.method))}</h3><pre>${h(page.text || "（文字を検出できませんでした）")}</pre></section>`).join("");
    $("toggleAllImportCandidates").checked = analysis.candidates.every((candidate) => candidate.selected);
    $("documentImportDialog").showModal();
    $("documentImportDialog").querySelector(".import-dialog-body").scrollTop = 0;
    updateSelectionState();
  }

  async function analyzeFile(file) {
    if (running) return;
    running = true;
    $("documentDropZone").disabled = true;
    try {
      updateProgress({ message: "資料を読み込んでいます…", progress: 0 });
      const extracted = await reader.read(file, updateProgress);
      const analysis = analyzer.analyze(extracted.pages, activeMaster(), consultingMaster, window.SEKISAN_JURISDICTIONS || []);
      renderReview(extracted.fileName, analysis);
    } catch (error) {
      updateProgress({ message: `読取り失敗：${error.message}`, progress: 0 });
      app.notify(error.message || "資料を読み取れませんでした");
    } finally {
      running = false;
      $("documentDropZone").disabled = false;
      $("documentFileInput").value = "";
    }
  }

  function analyzePastedText() {
    const text = $("documentPasteText").value.trim();
    if (!text) { app.notify("解析する原文を貼り付けてください"); return; }
    const pages = text.split(/\n\s*---\s*(?:改ページ|page break)\s*---\s*\n/i).map((pageText, index) => ({ pageNumber: index + 1, text: pageText, method: "text" }));
    renderReview("貼り付け原文", analyzer.analyze(pages, activeMaster(), consultingMaster, window.SEKISAN_JURISDICTIONS || []));
  }

  function applyImport() {
    if ($("applyDocumentImportButton").dataset.action === "close") {
      $("documentImportDialog").close();
      return;
    }
    const survey = [];
    const consulting = [];
    const costs = {};
    const metadata = {};
    document.querySelectorAll(".import-metadata-row").forEach((row) => {
      if (!row.querySelector(".import-metadata-select")?.checked) return;
      const input = row.querySelector(".import-metadata-value");
      if (!input) return;
      metadata[input.dataset.metadataKey] = input.dataset.metadataKey === "fiscalYear" ? Math.floor(Number(input.value) || 0) : input.value.trim();
    });
    document.querySelectorAll(".import-candidate").forEach((row) => {
      if (!row.querySelector(".import-candidate-select")?.checked) return;
      const original = currentAnalysis?.candidates.find((candidate) => candidate.id === row.dataset.candidateId) || {};
      const source = { fileName: currentFileName, page: original.page, method: original.method, confidence: original.confidence, sourceText: original.sourceText };
      if (row.dataset.kind === "survey") survey.push({ ...source, code: row.querySelector(".import-survey-code").value, quantity: row.querySelector(".import-survey-quantity").value });
      if (row.dataset.kind === "consulting") consulting.push({ ...source, serviceType: row.querySelector(".import-consulting-service").value, taskName: row.querySelector(".import-consulting-task").value, role: row.querySelector(".import-consulting-role").value, days: row.querySelector(".import-consulting-days").value });
      if (row.dataset.kind === "consultingCost") costs[row.querySelector(".import-cost-key").value] = Math.max(0, Math.floor(Number(row.querySelector(".import-cost-amount").value) || 0));
    });
    const active = activeMaster();
    const changesMaster = (metadata.jurisdictionCode && metadata.jurisdictionCode !== active.jurisdictionCode) || (metadata.fiscalYear && metadata.fiscalYear !== active.fiscalYear);
    if (changesMaster && !window.confirm("発注機関または年度マスターを切り替えると、現在の積算行の一部が対象外になる場合があります。確認済みの資料内容として切り替えますか？")) return;
    const metadataResult = app.applyImportedMetadata(metadata);
    if (!metadataResult.masterFound) { app.notify("選択した発注機関・年度のマスターがありません。基本情報と積算年度を確認してください"); return; }
    const surveyResult = app.importSurveyLines(survey, { fileName: currentFileName });
    const detail = { fileName: currentFileName, lines: consulting, costs, includeSurvey: survey.length > 0 && consulting.length > 0, result: { added: 0, rejected: 0 } };
    document.dispatchEvent(new CustomEvent("ezsekisan:consultingimport", { detail }));
    $("documentImportDialog").close();
    const totalAdded = metadataResult.applied + surveyResult.added + (detail.result?.added || 0) + Object.keys(costs).length;
    $("lastImportSummary").hidden = false;
    $("lastImportSummary").innerHTML = `<strong>直近の取込</strong><br>${h(currentFileName)}から、基本情報${metadataResult.applied}件、測量${surveyResult.added}件、設計・調査人工${detail.result?.added || 0}件、積上費用${Object.keys(costs).length}件を反映しました。原文照合済みとして自動確定はしていません。`;
    app.notify(`${totalAdded}件を積算へ反映しました`);
    const target = consulting.length || Object.keys(costs).length ? "consulting" : "estimate";
    document.querySelector(`.view-tab[data-view="${target}"]`)?.click();
  }

  function bindEvents() {
    const zone = $("documentDropZone");
    zone.addEventListener("click", () => $("documentFileInput").click());
    $("documentFileInput").addEventListener("change", (event) => { if (event.target.files?.[0]) analyzeFile(event.target.files[0]); });
    ["dragenter", "dragover"].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); if (!running) zone.classList.add("drag-over"); }));
    ["dragleave", "drop"].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.remove("drag-over"); }));
    zone.addEventListener("drop", (event) => { if (!running && event.dataTransfer?.files?.[0]) analyzeFile(event.dataTransfer.files[0]); });
    $("analyzePastedTextButton").addEventListener("click", analyzePastedText);
    ["closeDocumentImportDialogButton", "cancelDocumentImportButton"].forEach((id) => $(id).addEventListener("click", () => $("documentImportDialog").close()));
    $("documentImportDialog").addEventListener("click", (event) => { if (event.target === $("documentImportDialog")) $("documentImportDialog").close(); });
    $("toggleAllImportCandidates").addEventListener("change", (event) => { document.querySelectorAll(".import-candidate-select").forEach((box) => { box.checked = event.target.checked; }); updateSelectionState(); });
    $("toggleAllImportMetadata").addEventListener("change", (event) => { document.querySelectorAll(".import-metadata-select").forEach((box) => { box.checked = event.target.checked; }); updateSelectionState(); });
    $("documentImportMetadataList").addEventListener("change", (event) => { if (event.target.classList.contains("import-metadata-select")) updateSelectionState(); });
    $("documentImportCandidateList").addEventListener("change", (event) => {
      const row = event.target.closest(".import-candidate");
      if (event.target.classList.contains("import-candidate-select")) updateSelectionState();
      if (event.target.classList.contains("import-survey-code")) {
        const item = activeMaster().workItems.find((entry) => entry.code === event.target.value);
        const quantity = row.querySelector(".import-survey-quantity");
        const rule = window.SekisanEngine.quantityRule(item, activeMaster());
        quantity.min = rule.min;
        quantity.step = rule.step;
        quantity.value = window.SekisanEngine.normalizeQuantity(quantity.value, item, activeMaster());
        row.querySelector(".import-survey-unit").textContent = item.unit;
      }
      if (event.target.classList.contains("import-consulting-service")) row.querySelector(".import-consulting-role").innerHTML = roleOptions(event.target.value, "");
    });
    $("applyDocumentImportButton").addEventListener("click", applyImport);
  }

  bindEvents();
})();
