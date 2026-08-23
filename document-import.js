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
  const clickLineTargets = new Map();
  const clickLines = new Map();
  const editablePdfTargets = new Map();
  const ignoredPdfLines = new Set();
  const manualSourceLineIds = new Set();
  let currentManualLineId = "";
  let manualItemLineId = "";
  let manualQuantityLineId = "";
  let manualCandidateSequence = 0;
  let currentEditingTarget = null;
  let running = false;
  const PDF_LINE_DRAG_TYPE = "application/x-ezsekisan-pdf-line";
  let pointerPdfDrag = null;
  let suppressPdfClickLineId = "";

  const metadataLabels = {
    projectName: "業務名",
    orderingParty: "発注者",
    department: "担当部署",
    contactName: "担当者",
    workLocation: "業務場所",
    contractPeriod: "履行期間",
    documentNumber: "文書・業務番号",
    documentDate: "公告・資料日"
  };

  function activeMaster() { return app.getActiveSurveyMaster(); }
  function serviceById(id) { return consultingMaster.serviceTypes.find((entry) => entry.id === id) || consultingMaster.serviceTypes[0]; }
  function rolesFor(serviceType) { return consultingMaster.roleGroups[serviceById(serviceType).roleGroup] || []; }

  function updateProgress(status) {
    $("documentImportProgress").hidden = false;
    $("documentImportStatus").textContent = status.message || "解析しています…";
    const percent = status.progress == null ? 12 : Math.max(0, Math.min(100, Math.round(status.progress * 100)));
    $("documentImportProgressBar").style.width = `${percent}%`;
  }

  function surveyOptions(selectedCode, includeBlank = false, category = "") {
    const blank = includeBlank ? '<option value="">測量項目を選択してください</option>' : "";
    return blank + activeMaster().workItems.filter((item) => !category || item.category === category).map((item) => `<option value="${h(item.code)}" ${item.code === selectedCode ? "selected" : ""}>${h(item.code)}｜${h(item.name)}</option>`).join("");
  }

  function surveyCategoryOptions(selectedCategory = "") {
    const categories = [...new Set(activeMaster().workItems.map((item) => item.category).filter(Boolean))];
    return '<option value="">すべての分類</option>' + categories.map((category) => `<option value="${h(category)}" ${category === selectedCategory ? "selected" : ""}>${h(category)}</option>`).join("");
  }

  function populateManualSurveyItems() {
    const category = $("pdfManualSurveyCategory").value;
    const previous = $("pdfManualSurveyCode").value;
    $("pdfManualSurveyCode").innerHTML = surveyOptions(previous, true, category);
    if (![...$("pdfManualSurveyCode").options].some((option) => option.value === previous)) $("pdfManualSurveyCode").value = "";
    updateManualSurveyRule();
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

  function quantityFromLine(text) {
    const values = [...String(text || "").replace(/,/g, "").matchAll(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$|点|km|m|ha|業務|式|回|人日)/g)];
    return values.length ? values[values.length - 1][1] : "1";
  }

  function closeManualMapper() {
    currentManualLineId = "";
    manualItemLineId = "";
    manualQuantityLineId = "";
    manualSourceLineIds.clear();
    $("pdfDragItemValue").textContent = "ここへドロップ";
    $("pdfDragQuantityValue").textContent = "ここへドロップ";
    currentEditingTarget = null;
    $("pdfManualKind").disabled = false;
    $("pdfManualHeadingText").textContent = "この行の反映先を指定";
    $("addPdfManualCandidateButton").textContent = "反映待ちへ追加";
    $("pdfManualMapper").hidden = true;
  }

  function updateManualSourceSummary() {
    const itemLine = clickLines.get(manualItemLineId);
    const quantityLine = clickLines.get(manualQuantityLineId);
    const fallback = clickLines.get(currentManualLineId);
    const parts = [];
    if (itemLine) parts.push(`項目：${itemLine.text}`);
    if (quantityLine) parts.push(`数量：${quantityLine.text}`);
    $("pdfManualSourceText").textContent = parts.length ? parts.join(" ／ ") : fallback?.text || "—";
    $("pdfDragItemValue").textContent = itemLine?.text || "ここへドロップ";
    $("pdfDragQuantityValue").textContent = quantityLine?.text || "ここへドロップ";
  }

  function updateManualSurveyRule() {
    const item = activeMaster().workItems.find((entry) => entry.code === $("pdfManualSurveyCode").value);
    if (!item) {
      $("pdfManualSurveyUnit").textContent = "—";
      $("pdfManualSurveyRule").textContent = "項目を選択してください。";
      return;
    }
    const rule = window.SekisanEngine.quantityRule(item, activeMaster());
    const input = $("pdfManualSurveyQuantity");
    input.min = rule.min;
    input.step = rule.step;
    $("pdfManualSurveyUnit").textContent = item.unit;
    $("pdfManualSurveyRule").textContent = rule.integer ? `${item.unit}は整数のみ入力できます。` : `${item.unit}は刻み ${rule.step} で入力できます。`;
  }

  function updateManualKind() {
    const kind = $("pdfManualKind").value;
    $("pdfManualSurveyFields").hidden = kind !== "survey";
    $("pdfManualConsultingFields").hidden = kind !== "consulting";
    $("pdfManualMetadataFields").hidden = kind !== "metadata";
  }

  function updateManualConsultingRoles() {
    const serviceType = $("pdfManualConsultingService").value;
    $("pdfManualConsultingRole").innerHTML = roleOptions(serviceType, $("pdfManualConsultingRole").value);
  }

  function openManualMapper(lineId, options = {}) {
    const line = clickLines.get(lineId);
    if (!line) return;
    const preserve = options.preserve === true && !$("pdfManualMapper").hidden;
    if (!preserve) {
      currentEditingTarget = null;
      $("pdfManualKind").disabled = false;
      $("pdfManualHeadingText").textContent = "この行の反映先を指定";
      $("addPdfManualCandidateButton").textContent = "反映待ちへ追加";
      currentManualLineId = lineId;
      manualItemLineId = "";
      manualQuantityLineId = "";
      manualSourceLineIds.clear();
      manualSourceLineIds.add(lineId);
      $("pdfManualSurveyCategory").innerHTML = surveyCategoryOptions();
      $("pdfManualSurveyCategory").value = "";
      populateManualSurveyItems();
      $("pdfManualSurveyQuantity").value = quantityFromLine(line.contextText || line.text);
      $("pdfManualConsultingService").innerHTML = serviceOptions("design");
      $("pdfManualConsultingTask").value = line.text;
      $("pdfManualConsultingDays").value = quantityFromLine(line.text);
      $("pdfManualMetadataValue").value = line.text;
      updateManualSurveyRule();
      updateManualConsultingRoles();
      updateManualKind();
    } else {
      manualSourceLineIds.add(lineId);
    }
    $("pdfManualMapper").hidden = false;
    updateManualSourceSummary();
    if (options.scroll !== false) $("pdfManualMapper").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function matchSurveyDrop(text) {
    const key = analyzer.compact(text);
    if (!key) return { category: "", item: null, matches: [] };
    const items = activeMaster().workItems;
    const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
    const category = categories.find((value) => {
      const categoryKey = analyzer.compact(value);
      return key === categoryKey || (categoryKey.length >= 3 && key.includes(categoryKey));
    }) || "";
    const matches = items.filter((item) => {
      const nameKey = analyzer.compact(item.name);
      return key === nameKey || (key.length >= 3 && nameKey.includes(key)) || (nameKey.length >= 5 && key.includes(nameKey));
    });
    const exact = matches.find((item) => analyzer.compact(item.name) === key);
    return { category: exact?.category || (matches.length && matches.every((item) => item.category === matches[0].category) ? matches[0].category : category), item: exact || (matches.length === 1 ? matches[0] : null), matches };
  }

  function applyDraggedPdfLine(lineId, targetType) {
    const line = clickLines.get(lineId);
    if (!line) return;
    const preserve = !$("pdfManualMapper").hidden;
    openManualMapper(lineId, { preserve, scroll: false });
    $("pdfManualKind").value = "survey";
    updateManualKind();
    manualSourceLineIds.add(lineId);
    if (targetType === "quantity") {
      manualQuantityLineId = lineId;
      $("pdfManualSurveyQuantity").value = quantityFromLine(line.text);
      const item = activeMaster().workItems.find((entry) => entry.code === $("pdfManualSurveyCode").value);
      if (item) $("pdfManualSurveyQuantity").value = window.SekisanEngine.normalizeQuantity($("pdfManualSurveyQuantity").value, item, activeMaster());
      app.notify(`数量「${line.text}」を右側へ入れました`);
    } else {
      currentManualLineId = lineId;
      manualItemLineId = lineId;
      const matched = matchSurveyDrop(line.text);
      $("pdfManualSurveyCategory").value = matched.category || "";
      populateManualSurveyItems();
      if (matched.item) {
        $("pdfManualSurveyCode").value = matched.item.code;
        updateManualSurveyRule();
        app.notify(`項目「${matched.item.name}」を選びました`);
      } else if (matched.matches.length > 1) {
        app.notify(`候補が${matched.matches.length}件あります。右側で詳細項目を選んでください`);
      } else {
        app.notify("一致する詳細項目を確定できません。右側で分類と詳細項目を選んでください");
      }
    }
    updateManualSourceSummary();
  }

  function finishPointerPdfDrag(event) {
    if (!pointerPdfDrag) return;
    const drag = pointerPdfDrag;
    pointerPdfDrag = null;
    const button = document.querySelector(`[data-pdf-line-id="${drag.lineId}"]`);
    if (button) button.dataset.dragging = "false";
    if (!drag.moved) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-pdf-drop-target]");
    if (!target) return;
    suppressPdfClickLineId = drag.lineId;
    event.preventDefault();
    applyDraggedPdfLine(drag.lineId, target.dataset.pdfDropTarget);
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

  function allClickTargets() {
    if (!currentAnalysis) return [];
    return [
      ...currentAnalysis.metadata.fields.map((item) => ({ type: "metadata", item })),
      ...currentAnalysis.candidates.map((item) => ({ type: "candidate", item }))
    ];
  }

  function lineTargets(pageNumber, text) {
    const key = analyzer.compact(text);
    if (!key) return [];
    return allClickTargets().filter((target) => {
      if (Number(target.item.page) !== Number(pageNumber)) return false;
      const sourceKey = analyzer.compact(target.item.sourceText || "");
      const nameCharacters = key.replace(/[0-9.,/%㎡²㎢mha式回点業務]/gi, "");
      return sourceKey === key || (nameCharacters.length >= 3 && Math.min(sourceKey.length, key.length) >= 5 && (sourceKey.includes(key) || key.includes(sourceKey)));
    });
  }

  function clickTargetLabel(target) {
    const item = target.item;
    if (target.type === "metadata") return `${item.label}：${item.displayValue || item.value}`;
    if (item.kind === "survey") return `${item.label}：${item.quantity}${item.unit}`;
    if (item.kind === "consulting") {
      const roleName = rolesFor(item.serviceType).find((role) => role.id === item.role)?.name || item.role;
      return `${item.taskName}／${roleName}：${item.days}人日`;
    }
    return `${item.label}：${Number(item.amount || 0).toLocaleString("ja-JP")}円`;
  }

  function isEditableClickTarget(target) {
    return target.type === "metadata"
      ? Object.prototype.hasOwnProperty.call(metadataLabels, target.item.key)
      : target.item.kind === "survey" || target.item.kind === "consulting";
  }

  function sourceLineIdsForTarget(target) {
    const lineIds = [];
    clickLineTargets.forEach((targets, lineId) => {
      if (targets.some((entry) => entry.type === target.type && entry.item === target.item)) lineIds.push(lineId);
    });
    return lineIds;
  }

  function openSelectedTargetEditor(target) {
    if (!isEditableClickTarget(target)) {
      app.notify("この費用項目は「一覧で詳しく修正」から変更してください");
      return;
    }
    const lineIds = sourceLineIdsForTarget(target);
    const primaryLineId = lineIds[0];
    if (!primaryLineId || !clickLines.has(primaryLineId)) {
      app.notify("元のPDF行を確認できないため、一覧で詳しく修正してください");
      return;
    }
    openManualMapper(primaryLineId, { scroll: false });
    currentEditingTarget = target;
    manualSourceLineIds.clear();
    lineIds.forEach((lineId) => manualSourceLineIds.add(lineId));
    $("pdfManualKind").disabled = true;
    $("pdfManualHeadingText").textContent = "追加した項目を変更";
    $("addPdfManualCandidateButton").textContent = "変更を保存";
    if (target.type === "metadata") {
      $("pdfManualKind").value = "metadata";
      $("pdfManualMetadataKey").value = target.item.key;
      $("pdfManualMetadataValue").value = target.item.value || target.item.displayValue || "";
    } else if (target.item.kind === "survey") {
      const selectedItem = activeMaster().workItems.find((entry) => entry.code === target.item.code);
      $("pdfManualKind").value = "survey";
      $("pdfManualSurveyCategory").value = selectedItem?.category || "";
      populateManualSurveyItems();
      $("pdfManualSurveyCode").value = target.item.code;
      $("pdfManualSurveyQuantity").value = target.item.quantity;
      updateManualSurveyRule();
    } else {
      $("pdfManualKind").value = "consulting";
      $("pdfManualConsultingService").value = target.item.serviceType;
      updateManualConsultingRoles();
      $("pdfManualConsultingTask").value = target.item.taskName;
      $("pdfManualConsultingRole").value = target.item.role;
      $("pdfManualConsultingDays").value = target.item.days;
    }
    updateManualKind();
    $("pdfManualSourceText").textContent = `変更中：${clickTargetLabel(target)}`;
    $("pdfManualMapper").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function updatePdfClickSelection() {
    const targets = allClickTargets();
    const selected = targets.filter((target) => target.item.selected && !target.item.applied);
    $("pdfClickSelectedCount").textContent = `${selected.length}件`;
    $("pdfClickSelectionHint").textContent = selected.length
      ? "内容を確認し、下のボタンでこの画面のまま積算へ追加できます。"
      : clickLines.size ? `PDFの文字行が${clickLines.size}行あります。必要な行を続けてクリックしてください。` : "クリックできる文字行を表示できませんでした。";
    editablePdfTargets.clear();
    $("pdfClickSelectedList").innerHTML = selected.length
      ? selected.map((target, index) => {
        const detail = `${methodLabel(target.item.method)}／p.${target.item.page}／${confidenceLabel(target.item.confidence)}`;
        if (!isEditableClickTarget(target)) return `<div class="pdf-click-selected-item"><strong>${h(clickTargetLabel(target))}</strong><span>${h(detail)}／一覧で変更</span></div>`;
        const key = `target-${index}`;
        editablePdfTargets.set(key, target);
        return `<button class="pdf-click-selected-item" data-pdf-edit-target="${h(key)}" type="button" title="クリックして変更"><strong>${h(clickTargetLabel(target))}</strong><span>${h(detail)}／クリックして変更</span></button>`;
      }).join("")
      : '<div class="empty-state"><p>まだ選択されていません。</p></div>';
    $("openPdfSelectionReviewButton").disabled = selected.length === 0;
    $("applyPdfSelectionNowButton").disabled = selected.length === 0;
    $("applyPdfSelectionNowButton").textContent = selected.length ? `反映待ち${selected.length}件を積算へ追加` : "反映待ちを積算へ追加";
    clickLineTargets.forEach((lineTargetList, lineId) => {
      const button = document.querySelector(`[data-pdf-line-id="${lineId}"]`);
      if (!button) return;
      button.dataset.selected = lineTargetList.some((target) => target.item.selected && !target.item.applied) ? "true" : "false";
      button.dataset.applied = lineTargetList.length > 0 && lineTargetList.every((target) => target.item.applied) ? "true" : "false";
      button.dataset.mapped = lineTargetList.length ? "true" : "false";
      button.dataset.ignored = ignoredPdfLines.has(lineId) ? "true" : "false";
    });
  }

  function renderPdfClickWorkbench(extracted, analysis) {
    currentFileName = extracted.fileName;
    currentAnalysis = analysis;
    clickLineTargets.clear();
    clickLines.clear();
    ignoredPdfLines.clear();
    closeManualMapper();
    $("pdfClickFileName").textContent = extracted.fileName;
    $("pdfClickPages").innerHTML = extracted.pages.map((page) => {
      const preview = page.preview;
      if (!preview?.imageDataUrl) return "";
      let mappedLines = 0;
      const buttons = (preview.lines || []).map((line, index) => {
        const targets = lineTargets(page.pageNumber, line.text);
        const lineId = `p${page.pageNumber}-l${index}`;
        clickLineTargets.set(lineId, targets);
        clickLines.set(lineId, { ...line, page: page.pageNumber, method: page.method });
        if (targets.length) mappedLines += 1;
        const confidence = !targets.length ? "unmapped" : targets.some((target) => target.item.confidence === "low") ? "low" : targets.some((target) => target.item.confidence === "medium") ? "medium" : "high";
        const labels = targets.length ? targets.map(clickTargetLabel).join("／") : `${line.text}：反映先を指定`;
        return `<button class="pdf-line-hotspot" draggable="true" data-pdf-line-id="${h(lineId)}" data-confidence="${h(confidence)}" data-mapped="${targets.length ? "true" : "false"}" data-selected="false" data-applied="false" data-ignored="false" data-dragging="false" type="button" style="left:${(line.left * 100).toFixed(3)}%;top:${(line.top * 100).toFixed(3)}%;width:${(line.width * 100).toFixed(3)}%;height:${(line.height * 100).toFixed(3)}%" aria-label="${h(labels)}" title="${h(labels)}（クリックまたは右側へドラッグ）"></button>`;
      }).join("");
      const allLines = (preview.lines || []).length;
      return `<article class="pdf-click-page"><header><span>${h(page.pageNumber)}ページ／${h(methodLabel(page.method))}</span><span>選択可能 ${allLines}文字ブロック／自動判定 ${mappedLines}</span></header><div class="pdf-click-stage"><img src="${h(preview.imageDataUrl)}" alt="${h(page.pageNumber)}ページ"><div class="pdf-click-overlay">${buttons}</div></div></article>`;
    }).join("");
    analysis.metadata.fields.forEach((field) => { field.selected = false; field.applied = false; });
    analysis.candidates.forEach((candidate) => { candidate.selected = false; candidate.applied = false; });
    $("pdfClickWorkbench").hidden = false;
    updatePdfClickSelection();
    $("pdfClickWorkbench").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addManualCandidate() {
    const primaryLineId = manualItemLineId || currentManualLineId || manualQuantityLineId;
    const line = clickLines.get(primaryLineId);
    if (!line || !currentAnalysis) return;
    const source = { page: line.page, method: line.method, confidence: "medium", sourceText: line.text, selected: true, applied: false, manual: true };
    const editingTarget = currentEditingTarget;
    let target;
    if ($("pdfManualKind").value === "survey") {
      const item = activeMaster().workItems.find((entry) => entry.code === $("pdfManualSurveyCode").value);
      if (!item) { app.notify("反映する測量項目を選択してください"); return; }
      const quantity = window.SekisanEngine.normalizeQuantity($("pdfManualSurveyQuantity").value, item, activeMaster());
      $("pdfManualSurveyQuantity").value = quantity;
      if (editingTarget) {
        Object.assign(editingTarget.item, { kind: "survey", code: item.code, label: item.name, unit: item.unit, quantity, selected: true });
        target = editingTarget;
      } else {
        const candidate = { ...source, id: `manual-${++manualCandidateSequence}`, kind: "survey", code: item.code, label: item.name, unit: item.unit, quantity };
        currentAnalysis.candidates.push(candidate);
        target = { type: "candidate", item: candidate };
      }
    } else if ($("pdfManualKind").value === "consulting") {
      const serviceType = $("pdfManualConsultingService").value;
      const taskName = $("pdfManualConsultingTask").value.trim();
      const days = Math.round(Math.max(0, Number($("pdfManualConsultingDays").value) || 0) * 1000) / 1000;
      if (!taskName) { app.notify("作業名を入力してください"); return; }
      if (days <= 0) { app.notify("人工は0より大きい値を入力してください"); return; }
      if (editingTarget) {
        Object.assign(editingTarget.item, { kind: "consulting", serviceType, taskName, role: $("pdfManualConsultingRole").value, days, selected: true });
        target = editingTarget;
      } else {
        const candidate = { ...source, id: `manual-${++manualCandidateSequence}`, kind: "consulting", serviceType, taskName, role: $("pdfManualConsultingRole").value, days };
        currentAnalysis.candidates.push(candidate);
        target = { type: "candidate", item: candidate };
      }
    } else {
      const key = $("pdfManualMetadataKey").value;
      const value = $("pdfManualMetadataValue").value.trim();
      if (!value) { app.notify("反映する内容を入力してください"); return; }
      if (editingTarget) {
        Object.assign(editingTarget.item, { key, label: metadataLabels[key] || key, value, displayValue: value, selected: true });
        target = editingTarget;
      } else {
        const field = { ...source, key, label: metadataLabels[key] || key, value, displayValue: value, affectsCalculation: false };
        currentAnalysis.metadata.fields.push(field);
        target = { type: "metadata", item: field };
      }
    }
    if (editingTarget) {
      const changedLabel = clickTargetLabel(target);
      closeManualMapper();
      updatePdfClickSelection();
      app.notify(`「${changedLabel}」へ変更しました`);
      return;
    }
    const sourceLineIds = manualSourceLineIds.size ? [...manualSourceLineIds] : [primaryLineId];
    sourceLineIds.forEach((lineId) => {
      const targets = clickLineTargets.get(lineId) || [];
      if (!targets.includes(target)) targets.push(target);
      clickLineTargets.set(lineId, targets);
      ignoredPdfLines.delete(lineId);
    });
    closeManualMapper();
    updatePdfClickSelection();
  }

  function selectedClickPayload() {
    const survey = [];
    const consulting = [];
    const costs = {};
    const metadata = {};
    const selected = allClickTargets().filter((target) => target.item.selected && !target.item.applied);
    selected.forEach((target) => {
      const item = target.item;
      if (target.type === "metadata") {
        if (item.key === "jurisdiction") metadata.jurisdictionCode = item.code;
        else if (item.key === "fiscalYear") metadata.fiscalYear = Math.floor(Number(item.value) || 0);
        else metadata[item.key] = String(item.value ?? "").trim();
        return;
      }
      const source = { fileName: currentFileName, page: item.page, method: item.method, confidence: item.confidence, sourceText: item.sourceText };
      if (item.kind === "survey") survey.push({ ...source, code: item.code, quantity: item.quantity });
      if (item.kind === "consulting") consulting.push({ ...source, serviceType: item.serviceType, taskName: item.taskName, role: item.role, days: item.days });
      if (item.kind === "consultingCost") costs[item.costKey] = Math.max(0, Math.floor(Number(item.amount) || 0));
    });
    return { selected, survey, consulting, costs, metadata };
  }

  function applyPdfClickSelection() {
    const payload = selectedClickPayload();
    if (!payload.selected.length) return;
    const active = activeMaster();
    const changesMaster = (payload.metadata.jurisdictionCode && payload.metadata.jurisdictionCode !== active.jurisdictionCode) || (payload.metadata.fiscalYear && payload.metadata.fiscalYear !== active.fiscalYear);
    if (changesMaster && !window.confirm("発注機関または年度マスターを切り替えると、現在の積算行の一部が対象外になる場合があります。確認済みの資料内容として切り替えますか？")) return;
    const metadataResult = app.applyImportedMetadata(payload.metadata);
    if (!metadataResult.masterFound) { app.notify("選択した発注機関・年度のマスターがありません。基本情報と積算年度を確認してください"); return; }
    const surveyResult = app.importSurveyLines(payload.survey, { fileName: currentFileName });
    const detail = { fileName: currentFileName, lines: payload.consulting, costs: payload.costs, includeSurvey: payload.survey.length > 0 && payload.consulting.length > 0, result: { added: 0, rejected: 0 } };
    document.dispatchEvent(new CustomEvent("ezsekisan:consultingimport", { detail }));
    payload.selected.forEach((target) => { target.item.selected = false; target.item.applied = true; });
    const totalAdded = metadataResult.applied + surveyResult.added + (detail.result?.added || 0) + Object.keys(payload.costs).length;
    $("lastImportSummary").hidden = false;
    $("lastImportSummary").innerHTML = `<strong>直近の取込</strong><br>${h(currentFileName)}から、基本情報${metadataResult.applied}件、測量${surveyResult.added}件、設計・調査人工${detail.result?.added || 0}件、積上費用${Object.keys(payload.costs).length}件を反映しました。PDF画面を閉じずに次の行を選択できます。`;
    updatePdfClickSelection();
    app.notify(`${totalAdded}件を積算へ反映しました。続けてPDFの行を選べます`);
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
    $("pdfClickWorkbench").hidden = true;
    $("pdfClickPages").innerHTML = "";
    clickLineTargets.clear();
    clickLines.clear();
    ignoredPdfLines.clear();
    closeManualMapper();
    try {
      updateProgress({ message: "資料を読み込んでいます…", progress: 0 });
      const extracted = await reader.read(file, updateProgress);
      const analysis = analyzer.analyze(extracted.pages, activeMaster(), consultingMaster, window.SEKISAN_JURISDICTIONS || []);
      if (extracted.pages.some((page) => page.preview?.imageDataUrl)) renderPdfClickWorkbench(extracted, analysis);
      else renderReview(extracted.fileName, analysis);
    } catch (error) {
      updateProgress({ message: `読取り失敗：${error.message}`, progress: 0 });
      app.notify(error.message || "資料を読み取れませんでした");
    } finally {
      running = false;
      $("documentDropZone").disabled = false;
      $("documentFileInput").value = "";
    }
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
    const stayOnPdf = !$("pdfClickWorkbench").hidden;
    $("documentImportDialog").close();
    const totalAdded = metadataResult.applied + surveyResult.added + (detail.result?.added || 0) + Object.keys(costs).length;
    $("lastImportSummary").hidden = false;
    $("lastImportSummary").innerHTML = `<strong>直近の取込</strong><br>${h(currentFileName)}から、基本情報${metadataResult.applied}件、測量${surveyResult.added}件、設計・調査人工${detail.result?.added || 0}件、積上費用${Object.keys(costs).length}件を反映しました。原文照合済みとして自動確定はしていません。`;
    app.notify(`${totalAdded}件を積算へ反映しました`);
    if (stayOnPdf) {
      allClickTargets().filter((target) => target.item.selected).forEach((target) => { target.item.selected = false; target.item.applied = true; });
      updatePdfClickSelection();
    } else {
      const target = consulting.length || Object.keys(costs).length ? "consulting" : "estimate";
      document.querySelector(`.view-tab[data-view="${target}"]`)?.click();
    }
  }

  function bindEvents() {
    const zone = $("documentDropZone");
    zone.addEventListener("click", () => $("documentFileInput").click());
    $("documentFileInput").addEventListener("change", (event) => { if (event.target.files?.[0]) analyzeFile(event.target.files[0]); });
    ["dragenter", "dragover"].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); if (!running) zone.classList.add("drag-over"); }));
    ["dragleave", "drop"].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.remove("drag-over"); }));
    zone.addEventListener("drop", (event) => { if (!running && event.dataTransfer?.files?.[0]) analyzeFile(event.dataTransfer.files[0]); });
    $("pdfClickPages").addEventListener("dragstart", (event) => {
      const button = event.target.closest(".pdf-line-hotspot");
      if (!button || button.dataset.applied === "true") { event.preventDefault(); return; }
      const line = clickLines.get(button.dataset.pdfLineId);
      if (!line || !event.dataTransfer) { event.preventDefault(); return; }
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData(PDF_LINE_DRAG_TYPE, button.dataset.pdfLineId);
      event.dataTransfer.setData("text/plain", line.text);
      button.dataset.dragging = "true";
    });
    $("pdfClickPages").addEventListener("dragend", (event) => {
      const button = event.target.closest(".pdf-line-hotspot");
      if (button) button.dataset.dragging = "false";
      document.querySelectorAll(".pdf-manual-drop-target.drag-over, .pdf-field-drop-target.drag-over").forEach((target) => target.classList.remove("drag-over"));
    });
    $("pdfClickPages").addEventListener("pointerdown", (event) => {
      const button = event.target.closest(".pdf-line-hotspot");
      if (!button || button.dataset.applied === "true") return;
      pointerPdfDrag = { lineId: button.dataset.pdfLineId, startX: event.clientX, startY: event.clientY, moved: false };
    });
    document.addEventListener("pointermove", (event) => {
      if (!pointerPdfDrag) return;
      const distance = Math.hypot(event.clientX - pointerPdfDrag.startX, event.clientY - pointerPdfDrag.startY);
      if (distance < 7) return;
      pointerPdfDrag.moved = true;
      const button = document.querySelector(`[data-pdf-line-id="${pointerPdfDrag.lineId}"]`);
      if (button) button.dataset.dragging = "true";
      document.querySelectorAll(".pdf-manual-drop-target.drag-over, .pdf-field-drop-target.drag-over").forEach((target) => target.classList.remove("drag-over"));
      document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-pdf-drop-target]")?.classList.add("drag-over");
    });
    document.addEventListener("pointerup", finishPointerPdfDrag);
    document.addEventListener("pointercancel", () => { pointerPdfDrag = null; });
    document.querySelectorAll("[data-pdf-drop-target]").forEach((target) => {
      ["dragenter", "dragover"].forEach((name) => target.addEventListener(name, (event) => {
        if (!event.dataTransfer?.types?.includes(PDF_LINE_DRAG_TYPE)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        target.classList.add("drag-over");
      }));
      target.addEventListener("dragleave", () => target.classList.remove("drag-over"));
      target.addEventListener("drop", (event) => {
        const lineId = event.dataTransfer?.getData(PDF_LINE_DRAG_TYPE);
        if (!lineId) return;
        event.preventDefault();
        event.stopPropagation();
        target.classList.remove("drag-over");
        applyDraggedPdfLine(lineId, target.dataset.pdfDropTarget);
      });
    });
    $("pdfClickPages").addEventListener("click", (event) => {
      const button = event.target.closest(".pdf-line-hotspot");
      if (!button) return;
      if (suppressPdfClickLineId === button.dataset.pdfLineId) { suppressPdfClickLineId = ""; return; }
      const targets = clickLineTargets.get(button.dataset.pdfLineId) || [];
      const available = targets.filter((target) => !target.item.applied);
      if (!available.length) {
        if (targets.length) app.notify("この行はすでに積算へ追加済みです");
        else openManualMapper(button.dataset.pdfLineId);
        return;
      }
      const select = !available.some((target) => target.item.selected);
      available.forEach((target) => { target.item.selected = select; });
      closeManualMapper();
      updatePdfClickSelection();
    });
    $("selectDetectedPdfLinesButton").addEventListener("click", () => {
      allClickTargets().forEach((target) => { target.item.selected = !target.item.applied && !target.item.affectsCalculation && target.item.confidence !== "low"; });
      updatePdfClickSelection();
    });
    $("clearPdfLineSelectionButton").addEventListener("click", () => {
      allClickTargets().forEach((target) => { target.item.selected = false; });
      updatePdfClickSelection();
    });
    $("pdfManualKind").addEventListener("change", updateManualKind);
    $("pdfManualSurveyCategory").addEventListener("change", populateManualSurveyItems);
    $("pdfManualSurveyCode").addEventListener("change", () => {
      updateManualSurveyRule();
      const item = activeMaster().workItems.find((entry) => entry.code === $("pdfManualSurveyCode").value);
      if (item) $("pdfManualSurveyQuantity").value = window.SekisanEngine.normalizeQuantity($("pdfManualSurveyQuantity").value, item, activeMaster());
    });
    $("pdfManualConsultingService").addEventListener("change", updateManualConsultingRoles);
    $("addPdfManualCandidateButton").addEventListener("click", addManualCandidate);
    $("pdfClickSelectedList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-pdf-edit-target]");
      if (!button) return;
      const target = editablePdfTargets.get(button.dataset.pdfEditTarget);
      if (target) openSelectedTargetEditor(target);
    });
    $("cancelPdfManualLineButton").addEventListener("click", closeManualMapper);
    $("ignorePdfManualLineButton").addEventListener("click", () => {
      if (!currentManualLineId) return;
      ignoredPdfLines.add(currentManualLineId);
      closeManualMapper();
      updatePdfClickSelection();
    });
    $("applyPdfSelectionNowButton").addEventListener("click", applyPdfClickSelection);
    $("openPdfSelectionReviewButton").addEventListener("click", () => renderReview(currentFileName, currentAnalysis));
    $("openPdfFullReviewButton").addEventListener("click", () => renderReview(currentFileName, currentAnalysis));
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
