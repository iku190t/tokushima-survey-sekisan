(function () {
  "use strict";

  const app = window.EzSekisanApp;
  const reader = window.DocumentReader;
  const analyzer = window.DocumentImportEngine;
  const consultingMaster = window.CONSULTING_MASTER;
  const consultingRulePack = window.CONSULTING_RULE_PACK || { rules: [], families: [] };
  const workCatalog = window.CONSULTING_WORK_CATALOG || { serviceIdsByScope: {}, keywordDefinitions: {} };
  if (!app || !reader || !analyzer || !consultingMaster) return;

  const $ = (id) => document.getElementById(id);
  const h = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const confidenceLabel = (value) => value === "high" ? "確信度：高" : value === "medium" ? "確信度：要確認" : "確信度：低";
  const methodLabel = (value) => value === "ocr" ? "OCR" : "PDF文字抽出";
  const quantityFormat = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 3 });
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
  let manualUnitLineId = "";
  let manualConsultingTaskLineId = "";
  let manualConsultingRoleLineId = "";
  let manualConsultingDaysLineId = "";
  let manualCandidateSequence = 0;
  let currentEditingTarget = null;
  let running = false;
  const PDF_LINE_DRAG_TYPE = "application/x-ezsekisan-pdf-line";
  let pointerPdfDrag = null;
  let suppressPdfClickLineId = "";
  const consultingServiceIdsByKind = Object.fromEntries(Object.entries(workCatalog.serviceIdsByScope).map(([kind, ids]) => [kind, new Set(ids)]));
  const activeManualKeywords = { design: "all", survey: "all", planning: "all", geology: "all" };
  const manualKindHeadings = {
    design: "PDFから設計業務の作業・人工を入れる",
    survey: "PDFから測量業務の項目・数量・単位を入れる",
    planning: "PDFから調査・計画業務の作業・人工を入れる",
    geology: "PDFから地質業務の作業・人工を入れる",
    metadata: "PDFから業務基本情報を入れる"
  };

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
  function isSurveyBusinessKind(kind) { return kind === "survey"; }
  function isConsultingBusinessKind(kind) { return ["design", "planning", "geology"].includes(kind); }
  function surveyItemsForKind(kind = "") {
    if (!isSurveyBusinessKind(kind)) return activeMaster().workItems;
    return surveyItemsForManualKeyword(app.getSurveyItemsForScope("survey", activeMaster()), kind);
  }
  function businessKindForSurveyItem(item) {
    return item ? "survey" : "survey";
  }
  function businessKindForService(serviceType) {
    if (consultingServiceIdsByKind.geology.has(serviceType)) return "geology";
    return serviceType === "planning" ? "planning" : "design";
  }

  function currentConsultingYear() {
    return Number(app.getEstimate()?.consulting?.fiscalYear || activeMaster()?.fiscalYear || 2026);
  }

  function keywordMatchesCode(definition, code, definitions) {
    if (!definition || definition.id === "all") return true;
    if (definition.fallback) return !definitions.some((entry) => entry.id !== "all" && !entry.fallback && entry.prefixes.some((prefix) => code.startsWith(prefix)));
    return definition.prefixes.some((prefix) => code.startsWith(prefix));
  }

  function consultingRulesForKind(kind = $("pdfManualKind")?.value || "design", applyKeyword = true) {
    const allowed = consultingServiceIdsByKind[kind] || consultingServiceIdsByKind.design || new Set(["design"]);
    const rules = (consultingRulePack.rules || []).filter((rule) => allowed.has(rule.serviceType) && Number(rule.fiscalYear) === currentConsultingYear());
    if (!applyKeyword) return rules;
    const definitions = workCatalog.keywordDefinitions[kind] || [];
    const selected = definitions.find((entry) => entry.id === activeManualKeywords[kind]) || definitions[0];
    return rules.filter((rule) => keywordMatchesCode(selected, String(rule.familyCode || ""), definitions));
  }

  function surveyItemsForManualKeyword(items, kind = "survey") {
    if (kind !== "survey") return items;
    const definitions = app.getSurveyKeywordDefinitions?.() || [];
    const selected = definitions.find((entry) => entry.id === activeManualKeywords.survey) || definitions[0];
    return !selected || selected.id === "all" ? items : items.filter((item) => selected.categories.includes(item.category));
  }

  function updateProgress(status) {
    $("documentImportProgress").hidden = false;
    $("documentImportStatus").textContent = status.message || "解析しています…";
    const percent = status.progress == null ? 12 : Math.max(0, Math.min(100, Math.round(status.progress * 100)));
    $("documentImportProgressBar").style.width = `${percent}%`;
  }

  function surveyOptions(selectedCode, includeBlank = false, category = "", kind = "", regulationGroupId = "") {
    const blank = includeBlank ? '<option value="">測量項目を選択してください</option>' : "";
    return blank + surveyItemsForKind(kind).filter((item) => {
      const group = app.getSurveyRegulationGroup(item);
      return (!regulationGroupId || group?.id === regulationGroupId) && (!category || item.category === category);
    }).map((item) => `<option value="${h(item.code)}" ${item.code === selectedCode ? "selected" : ""}>${h(item.code)}｜${h(item.name)}</option>`).join("");
  }

  function surveyRegulationGroupOptions(selectedGroup = "", kind = "") {
    const items = surveyItemsForKind(kind);
    return '<option value="">すべての作業規程分類</option>' + app.getSurveyRegulationGroups().filter((group) => items.some((item) => group.categories.includes(item.category))).map((group) => `<option value="${h(group.id)}" ${group.id === selectedGroup ? "selected" : ""}>${h(group.label)}</option>`).join("");
  }

  function surveyCategoryOptions(selectedCategory = "", kind = "", regulationGroupId = "") {
    const categories = [...new Set(surveyItemsForKind(kind).filter((item) => !regulationGroupId || app.getSurveyRegulationGroup(item)?.id === regulationGroupId).map((item) => item.category).filter(Boolean))];
    return '<option value="">すべての作業区分</option>' + categories.map((category) => `<option value="${h(category)}" ${category === selectedCategory ? "selected" : ""}>${h(category)}</option>`).join("");
  }

  function renderManualKeywords() {
    const kind = $("pdfManualKind").value;
    const filter = $("pdfManualKeywordFilter");
    filter.hidden = kind === "metadata";
    if (filter.hidden) { $("pdfManualKeywordList").innerHTML = ""; return; }
    let definitions;
    let allEntries;
    let countFor;
    if (kind === "survey") {
      definitions = app.getSurveyKeywordDefinitions?.() || [];
      allEntries = app.getSurveyItemsForScope("survey", activeMaster());
      countFor = (definition) => definition.id === "all" ? allEntries.length : allEntries.filter((item) => definition.categories.includes(item.category)).length;
    } else {
      definitions = workCatalog.keywordDefinitions[kind] || [];
      allEntries = consultingRulesForKind(kind, false);
      countFor = (definition) => definition.id === "all" ? allEntries.length : allEntries.filter((rule) => keywordMatchesCode(definition, String(rule.familyCode || ""), definitions)).length;
    }
    const available = definitions.filter((definition) => definition.id === "all" || countFor(definition) > 0);
    if (!available.some((definition) => definition.id === activeManualKeywords[kind])) activeManualKeywords[kind] = "all";
    $("pdfManualKeywordList").innerHTML = available.map((definition) => `<button class="work-keyword-button" type="button" data-pdf-manual-keyword="${h(definition.id)}" aria-pressed="${definition.id === activeManualKeywords[kind]}">${h(definition.label)}<small>${countFor(definition)}</small></button>`).join("");
  }

  function populateManualSurveyItems() {
    const kind = $("pdfManualKind").value;
    const regulationGroupId = $("pdfManualSurveyRegulationGroup").value;
    const category = $("pdfManualSurveyCategory").value;
    const previous = $("pdfManualSurveyCode").value;
    $("pdfManualSurveyCode").innerHTML = surveyOptions(previous, true, category, kind, regulationGroupId);
    if (![...$("pdfManualSurveyCode").options].some((option) => option.value === previous)) $("pdfManualSurveyCode").value = "";
    updateManualSurveyRule();
  }

  function populateManualSurveyCategories() {
    const kind = $("pdfManualKind").value;
    const groupId = $("pdfManualSurveyRegulationGroup").value;
    const previous = $("pdfManualSurveyCategory").value;
    $("pdfManualSurveyCategory").innerHTML = surveyCategoryOptions(previous, kind, groupId);
    if (![...$("pdfManualSurveyCategory").options].some((option) => option.value === previous)) $("pdfManualSurveyCategory").value = "";
    populateManualSurveyItems();
  }

  function serviceOptions(selectedId, kind = "") {
    const allowed = consultingServiceIdsByKind[kind];
    return consultingMaster.serviceTypes.filter((service) => !allowed || allowed.has(service.id)).map((service) => `<option value="${h(service.id)}" ${service.id === selectedId ? "selected" : ""}>${h(service.name)}</option>`).join("");
  }

  function roleOptions(serviceType, selectedId) {
    const roles = rolesFor(serviceType);
    const valid = roles.some((role) => role.id === selectedId) ? selectedId : roles[0]?.id;
    return roles.map((role) => `<option value="${h(role.id)}" ${role.id === valid ? "selected" : ""}>${h(role.name)}</option>`).join("");
  }

  function manualRoleOptions(serviceType, selectedId = "") {
    const roles = serviceType ? rolesFor(serviceType) : [];
    return '<option value="">職種を選択してください</option>' + roles.map((role) => `<option value="${h(role.id)}" ${role.id === selectedId ? "selected" : ""}>${h(role.name)}</option>`).join("");
  }

  function consultingFamilyLabel(rule) {
    const family = (consultingRulePack.families || []).find((entry) => Number(entry.fiscalYear) === Number(rule?.fiscalYear) && entry.serviceType === rule?.serviceType && entry.familyCode === rule?.familyCode);
    return `${rule?.familyCode || "共通"}｜${family?.title || "積算基準項目"}`;
  }

  function selectedManualConsultingRule() {
    const id = $("pdfManualConsultingTaskTemplate").value;
    return consultingRulesForKind($("pdfManualKind").value, false).find((rule) => rule.id === id) || null;
  }

  function syncManualConsultingRule() {
    const rule = selectedManualConsultingRule();
    if (!rule) {
      $("pdfManualConsultingService").innerHTML = "";
      $("pdfManualConsultingTask").value = "";
      $("pdfManualConsultingRole").innerHTML = manualRoleOptions("");
      return;
    }
    const kind = $("pdfManualKind").value;
    $("pdfManualConsultingService").innerHTML = serviceOptions(rule.serviceType, kind);
    $("pdfManualConsultingService").value = rule.serviceType;
    $("pdfManualConsultingTask").value = rule.label;
    updateManualConsultingRoles();
  }

  function clearManualInputValues() {
    $("pdfManualSurveyCode").value = "";
    $("pdfManualSurveyQuantity").value = "";
    $("pdfManualSurveySourceUnit").value = "";
    updateManualSurveyRule();
    $("pdfManualConsultingTaskTemplate").value = "";
    $("pdfManualConsultingTask").value = "";
    $("pdfManualConsultingRole").value = "";
    $("pdfManualConsultingDays").value = "";
    syncManualConsultingRule();
  }

  function jurisdictionOptions(selectedCode) {
    return (window.SEKISAN_JURISDICTIONS || []).map((entry) => `<option value="${h(entry.code)}" ${entry.code === selectedCode ? "selected" : ""}>${h(entry.name)}</option>`).join("");
  }

  function quantityFromLine(text) {
    const values = [...String(text || "").replace(/,/g, "").matchAll(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$|点|km|m|ha|業務|式|回|人日)/g)];
    return values.length ? values[values.length - 1][1] : "";
  }

  function decimalsFromStep(step) {
    const text = Number(step).toFixed(8).replace(/0+$/, "");
    return text.includes(".") ? text.split(".")[1].length : 0;
  }

  function enforceDecimalInput(input, decimals, normalizer) {
    if (!input || input.value === "") return null;
    const raw = input.value;
    if (["e", "E", "+", "-"].some((token) => raw.includes(token))) {
      input.value = "";
      app.notify(`0以上、小数第${decimals}位までで入力してください`);
      return null;
    }
    const fraction = raw.split(".")[1] || "";
    const value = normalizer(raw);
    if (fraction.length > decimals) {
      input.value = String(value);
      app.notify(decimals ? `小数第${decimals}位までに補正しました` : "整数に補正しました");
    }
    return value;
  }

  function closeManualMapper() {
    currentManualLineId = "";
    manualItemLineId = "";
    manualQuantityLineId = "";
    manualUnitLineId = "";
    manualConsultingTaskLineId = "";
    manualConsultingRoleLineId = "";
    manualConsultingDaysLineId = "";
    manualSourceLineIds.clear();
    currentEditingTarget = null;
    $("pdfManualKind").disabled = false;
    $("pdfManualHeadingText").textContent = "この行の反映先を指定";
    $("addPdfManualCandidateButton").textContent = "反映待ちへ追加";
    if ($("pdfClickWorkbench").hidden) $("pdfManualMapper").hidden = true;
    else showEmptyManualMapper();
  }

  function updateManualSurveyConversion() {
    const item = activeMaster().workItems.find((entry) => entry.code === $("pdfManualSurveyCode").value);
    if (!item) {
      $("pdfManualSurveyConversion").textContent = "項目を選択してください。";
      return null;
    }
    if ($("pdfManualSurveyQuantity").value === "" || !$("pdfManualSurveySourceUnit").value) {
      $("pdfManualSurveyConversion").textContent = "数量と単位を確認して入力してください。";
      return null;
    }
    const converted = analyzer.convertSurveyQuantity($("pdfManualSurveyQuantity").value, $("pdfManualSurveySourceUnit").value, item);
    const raw = quantityFormat.format(converted.rawQuantity);
    const result = quantityFormat.format(window.SekisanEngine.normalizeQuantity(converted.quantity, item, activeMaster()));
    $("pdfManualSurveyConversion").textContent = converted.factor === 1
      ? `${raw}${converted.sourceUnitLabel} ＝ ${result}${item.unit}（積算へ反映）`
      : `${raw} × ${converted.sourceUnitLabel} ＝ ${result}${item.unit}（積算へ反映）`;
    return converted;
  }

  function updateManualSurveyRule(preferredUnitId = "") {
    const item = activeMaster().workItems.find((entry) => entry.code === $("pdfManualSurveyCode").value);
    if (!item) {
      $("pdfManualSurveySourceUnit").innerHTML = '<option value="">単位を選択してください</option>';
      $("pdfManualSurveyConversion").textContent = "項目を選択してください。";
      $("pdfManualSurveyRule").textContent = "項目を選択してください。";
      return;
    }
    const rule = window.SekisanEngine.quantityRule(item, activeMaster());
    const options = analyzer.surveyUnitOptions(item);
    const sourceText = [manualUnitLineId, manualQuantityLineId, manualItemLineId, currentManualLineId]
      .map((lineId) => clickLines.get(lineId)?.contextText || clickLines.get(lineId)?.text || "").join(" ");
    const previous = preferredUnitId || $("pdfManualSurveySourceUnit").value;
    const detected = analyzer.detectSurveyUnitId(sourceText, item);
    const selected = options.some((option) => option.id === previous) ? previous : detected;
    $("pdfManualSurveySourceUnit").innerHTML = '<option value="">単位を選択してください</option>' + options.map((option) => `<option value="${h(option.id)}" ${option.id === selected ? "selected" : ""}>${h(option.label)}</option>`).join("");
    const input = $("pdfManualSurveyQuantity");
    const selectedOption = options.find((option) => option.id === $("pdfManualSurveySourceUnit").value) || options.find((option) => option.id === "base") || options[0];
    input.min = Math.max(0, rule.min / selectedOption.factor);
    input.step = Math.max(0.000001, rule.step / selectedOption.factor);
    $("pdfManualSurveyRule").textContent = `資料の数量を${selectedOption.label}で入力します。換算後の${item.unit}は${rule.integer ? "整数" : `小数第${rule.decimals}位まで`}に補正します。`;
    updateManualSurveyConversion();
  }

  function updateManualKind() {
    const kind = $("pdfManualKind").value;
    const surveyKind = isSurveyBusinessKind(kind);
    const consultingKind = isConsultingBusinessKind(kind);
    $("pdfManualSurveyFields").hidden = !surveyKind;
    $("pdfManualConsultingFields").hidden = !consultingKind;
    $("pdfManualMetadataFields").hidden = kind !== "metadata";
    renderManualKeywords();
    if (!currentManualLineId && !currentEditingTarget) $("pdfManualHeadingText").textContent = manualKindHeadings[kind] || "PDFから積算項目を入れる";
    if (surveyKind) {
      const previousGroup = $("pdfManualSurveyRegulationGroup").value;
      $("pdfManualSurveyRegulationGroup").innerHTML = surveyRegulationGroupOptions(previousGroup, kind);
      if (![...$("pdfManualSurveyRegulationGroup").options].some((option) => option.value === previousGroup)) $("pdfManualSurveyRegulationGroup").value = "";
      const previousCategory = $("pdfManualSurveyCategory").value;
      $("pdfManualSurveyCategory").innerHTML = surveyCategoryOptions(previousCategory, kind, $("pdfManualSurveyRegulationGroup").value);
      if (![...$("pdfManualSurveyCategory").options].some((option) => option.value === previousCategory)) $("pdfManualSurveyCategory").value = "";
      populateManualSurveyItems();
    }
    if (consultingKind) updateManualConsultingServices();
  }

  function showEmptyManualMapper() {
    $("pdfManualKind").value = "survey";
    $("pdfManualKind").disabled = false;
    $("pdfManualHeadingText").textContent = "PDFから項目・数量・単位を入れる";
    $("pdfManualSurveyRegulationGroup").innerHTML = surveyRegulationGroupOptions("", "survey");
    $("pdfManualSurveyRegulationGroup").value = "";
    $("pdfManualSurveyCategory").innerHTML = surveyCategoryOptions("", "survey", "");
    $("pdfManualSurveyCategory").value = "";
    populateManualSurveyItems();
    $("addPdfManualCandidateButton").textContent = "反映待ちへ追加";
    $("addPdfManualCandidateButton").disabled = true;
    $("ignorePdfManualLineButton").disabled = true;
    updateManualKind();
    clearManualInputValues();
    $("pdfManualMapper").hidden = false;
  }

  function updateManualConsultingRoles() {
    const serviceType = $("pdfManualConsultingService").value;
    $("pdfManualConsultingRole").innerHTML = manualRoleOptions(serviceType, $("pdfManualConsultingRole").value);
  }

  function updateManualConsultingTasks(selectedRule = "") {
    const kind = $("pdfManualKind").value;
    const rules = consultingRulesForKind(kind);
    const preferred = rules.find((rule) => rule.id === selectedRule || rule.label === selectedRule)
      || rules.find((rule) => rule.id === $("pdfManualConsultingTaskTemplate").value);
    const previousGroup = $("pdfManualConsultingRuleGroup").value;
    const preferredGroup = preferred?.familyCode || previousGroup;
    const groups = [...new Map(rules.map((rule) => [rule.familyCode, consultingFamilyLabel(rule)]))]
      .sort(([left], [right]) => String(left).localeCompare(String(right), "ja", { numeric: true }));
    $("pdfManualConsultingRuleGroup").innerHTML = groups.length
      ? groups.map(([code, label]) => `<option value="${h(code)}">${h(label)}</option>`).join("")
      : '<option value="">該当項目なし</option>';
    if (groups.some(([code]) => code === preferredGroup)) $("pdfManualConsultingRuleGroup").value = preferredGroup;
    updateManualConsultingItemsForGroup(preferred?.id || "");
  }

  function updateManualConsultingItemsForGroup(selectedRule = "") {
    const rules = consultingRulesForKind($("pdfManualKind").value);
    const group = $("pdfManualConsultingRuleGroup").value;
    const groupRules = rules.filter((rule) => rule.familyCode === group);
    const preferred = groupRules.find((rule) => rule.id === selectedRule);
    $("pdfManualConsultingTaskTemplate").innerHTML = groupRules.length
      ? '<option value="">作業項目を選択してください</option>' + groupRules.map((rule) => `<option value="${h(rule.id)}">${h(rule.label)}｜${h(rule.standardUnit || "1業務当り")}</option>`).join("")
      : '<option value="">該当項目なし</option>';
    if (preferred && groupRules.some((rule) => rule.id === preferred.id)) $("pdfManualConsultingTaskTemplate").value = preferred.id;
    syncManualConsultingRule();
  }

  function updateManualConsultingServices(selected = "") {
    updateManualConsultingTasks(selected);
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
      manualUnitLineId = "";
      manualConsultingTaskLineId = "";
      manualConsultingRoleLineId = "";
      manualConsultingDaysLineId = "";
      manualSourceLineIds.clear();
      manualSourceLineIds.add(lineId);
      const kind = $("pdfManualKind").value;
      $("pdfManualSurveyRegulationGroup").innerHTML = surveyRegulationGroupOptions("", isSurveyBusinessKind(kind) ? kind : "survey");
      $("pdfManualSurveyRegulationGroup").value = "";
      $("pdfManualSurveyCategory").innerHTML = surveyCategoryOptions("", isSurveyBusinessKind(kind) ? kind : "survey", "");
      $("pdfManualSurveyCategory").value = "";
      populateManualSurveyItems();
      $("pdfManualMetadataValue").value = line.text;
      updateManualKind();
      clearManualInputValues();
    } else {
      manualSourceLineIds.add(lineId);
    }
    $("pdfManualMapper").hidden = false;
    $("addPdfManualCandidateButton").disabled = false;
    $("ignorePdfManualLineButton").disabled = false;
    if (options.scroll !== false) $("pdfManualMapper").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function matchSurveyDrop(text) {
    const key = analyzer.compact(text);
    if (!key) return { category: "", item: null, matches: [] };
    const items = surveyItemsForKind($("pdfManualKind").value);
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

  function matchConsultingTaskDrop(text) {
    const key = analyzer.compact(text);
    const kind = isConsultingBusinessKind($("pdfManualKind").value) ? $("pdfManualKind").value : "design";
    const matches = consultingRulesForKind(kind, false).filter((rule) => {
      const taskKey = analyzer.compact(rule.label);
      return key === taskKey || (key.length >= 3 && taskKey.includes(key)) || (taskKey.length >= 4 && key.includes(taskKey));
    });
    const exact = matches.find((rule) => analyzer.compact(rule.label) === key);
    return exact ? { rule: exact, matches } : matches.length === 1 ? { rule: matches[0], matches } : { rule: null, matches };
  }

  function matchConsultingRoleDrop(text) {
    const key = analyzer.compact(text);
    if (!selectedManualConsultingRule()) return null;
    const serviceType = $("pdfManualConsultingService").value;
    return rolesFor(serviceType).find((role) => {
      const roleKey = analyzer.compact(role.name);
      return key === roleKey || key.includes(roleKey) || roleKey.includes(key);
    }) || null;
  }

  function applyDraggedPdfLine(lineId, targetType) {
    const line = clickLines.get(lineId);
    if (!line) return;
    const preserve = !$("pdfManualMapper").hidden;
    openManualMapper(lineId, { preserve, scroll: false });
    const consultingTarget = targetType.startsWith("consulting-");
    if (consultingTarget && !isConsultingBusinessKind($("pdfManualKind").value)) $("pdfManualKind").value = "design";
    if (!consultingTarget && !isSurveyBusinessKind($("pdfManualKind").value)) $("pdfManualKind").value = "survey";
    updateManualKind();
    manualSourceLineIds.add(lineId);
    if (targetType === "consulting-task") {
      currentManualLineId = lineId;
      manualConsultingTaskLineId = lineId;
      const matched = matchConsultingTaskDrop(line.text);
      if (matched.rule) {
        updateManualConsultingTasks(matched.rule.id);
        app.notify(`作業項目「${matched.rule.label}」を選びました`);
      } else if (matched.matches.length > 1) {
        app.notify(`候補が${matched.matches.length}件あります。キーワード、積算基準の作業区分、作業項目の順に選んでください`);
      } else {
        app.notify("一致する作業項目を確定できません。キーワード、積算基準の作業区分、作業項目の順に選んでください");
      }
    } else if (targetType === "consulting-role") {
      manualConsultingRoleLineId = lineId;
      const matched = matchConsultingRoleDrop(line.text);
      if (matched) {
        $("pdfManualConsultingRole").value = matched.id;
        app.notify(`職種「${matched.name}」を選びました`);
      } else {
        app.notify("一致する職種を確定できません。PDF横（狭い画面では下）の緑枠で職種を選んでください");
      }
    } else if (targetType === "consulting-days") {
      manualConsultingDaysLineId = lineId;
      $("pdfManualConsultingDays").value = quantityFromLine(line.text);
      app.notify(`人工「${line.text}」を緑枠の人工欄へ入れました`);
    } else if (targetType === "quantity") {
      manualQuantityLineId = lineId;
      $("pdfManualSurveyQuantity").value = quantityFromLine(line.text);
      updateManualSurveyConversion();
      app.notify(`数量「${line.text}」を緑枠の数量欄へ入れました`);
    } else if (targetType === "unit") {
      manualUnitLineId = lineId;
      const item = activeMaster().workItems.find((entry) => entry.code === $("pdfManualSurveyCode").value);
      if (item) {
        const unitId = analyzer.detectSurveyUnitId(line.text, item);
        if (unitId) {
          updateManualSurveyRule(unitId);
          app.notify(`単位「${line.text}」を緑枠の単位欄へ入れました`);
        } else {
          updateManualSurveyRule("");
          app.notify("単位を判定できません。PDF横（狭い画面では下）の緑枠で単位を選んでください");
        }
      } else {
        app.notify("先に積算する詳細項目を選んでください");
      }
    } else {
      currentManualLineId = lineId;
      manualItemLineId = lineId;
      const matched = matchSurveyDrop(line.text);
      const group = app.getSurveyRegulationGroup(matched.item || matched.matches[0]);
      $("pdfManualSurveyRegulationGroup").value = group?.id || "";
      populateManualSurveyCategories();
      $("pdfManualSurveyCategory").value = matched.category || "";
      populateManualSurveyItems();
      if (matched.item) {
        $("pdfManualSurveyCode").value = matched.item.code;
        updateManualSurveyRule();
        app.notify(`項目「${matched.item.name}」を選びました`);
      } else if (matched.matches.length > 1) {
        app.notify(`候補が${matched.matches.length}件あります。PDF横（狭い画面では下）の緑枠「PDFから項目・数量・単位を入れる」で詳細項目を選んでください`);
      } else {
        app.notify("一致する詳細項目を確定できません。PDF横（狭い画面では下）の緑枠で分類と詳細項目を選んでください");
      }
    }
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
    const businessLabel = candidate.kind === "survey"
      ? "測量業務"
      : candidate.kind === "consulting" ? ({ design: "設計業務", planning: "調査・計画業務", geology: "地質業務" }[businessKindForService(candidate.serviceType)] || "設計業務") : "積上費用";
    const commonStart = `<article class="import-candidate" data-candidate-id="${h(candidate.id)}" data-kind="${h(candidate.kind)}" data-confidence="${h(candidate.confidence)}"><input class="import-candidate-select" type="checkbox" ${candidate.selected ? "checked" : ""} aria-label="この候補を取り込む"><div class="import-candidate-type"><strong>${h(businessLabel)}</strong><span>${h(methodLabel(candidate.method))}／p.${h(candidate.page)}</span></div>`;
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
    if (item.kind === "survey") {
      const source = item.sourceQuantity != null && item.sourceUnitLabel ? `（資料：${item.sourceQuantity} × ${item.sourceUnitLabel}）` : "";
      return `${item.label}：${Number(item.quantity).toLocaleString("ja-JP", { maximumFractionDigits: 6 })}${item.unit}${source}`;
    }
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
      app.notify("この費用項目は積算へ追加後、該当する業務画面で変更してください");
      return;
    }
    const lineIds = sourceLineIdsForTarget(target);
    const primaryLineId = lineIds[0];
    if (!primaryLineId || !clickLines.has(primaryLineId)) {
      app.notify("元のPDF行を確認できないため、積算へ追加後に該当する業務画面で変更してください");
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
      $("pdfManualKind").value = businessKindForSurveyItem(selectedItem);
      updateManualKind();
      $("pdfManualSurveyRegulationGroup").value = app.getSurveyRegulationGroup(selectedItem)?.id || "";
      populateManualSurveyCategories();
      $("pdfManualSurveyCategory").value = selectedItem?.category || "";
      populateManualSurveyItems();
      $("pdfManualSurveyCode").value = target.item.code;
      $("pdfManualSurveyQuantity").value = target.item.sourceQuantity ?? target.item.quantity;
      updateManualSurveyRule(target.item.sourceUnitId || "base");
    } else {
      $("pdfManualKind").value = businessKindForService(target.item.serviceType);
      updateManualConsultingServices(target.item.referenceRuleId || target.item.taskName);
      updateManualConsultingRoles();
      $("pdfManualConsultingRole").value = target.item.role;
      $("pdfManualConsultingDays").value = target.item.days;
    }
    updateManualKind();
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
        if (!isEditableClickTarget(target)) return `<div class="pdf-click-selected-item"><strong>${h(clickTargetLabel(target))}</strong><span>${h(detail)}／追加後に該当業務画面で変更</span></div>`;
        const key = `target-${index}`;
        editablePdfTargets.set(key, target);
        return `<button class="pdf-click-selected-item" data-pdf-edit-target="${h(key)}" type="button" title="クリックして変更"><strong>${h(clickTargetLabel(target))}</strong><span>${h(detail)}／クリックして変更</span></button>`;
      }).join("")
      : '<div class="empty-state"><p>まだ選択されていません。</p></div>';
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
        return `<button class="pdf-line-hotspot" draggable="true" data-pdf-line-id="${h(lineId)}" data-confidence="${h(confidence)}" data-mapped="${targets.length ? "true" : "false"}" data-selected="false" data-applied="false" data-ignored="false" data-dragging="false" type="button" style="left:${(line.left * 100).toFixed(3)}%;top:${(line.top * 100).toFixed(3)}%;width:${(line.width * 100).toFixed(3)}%;height:${(line.height * 100).toFixed(3)}%" aria-label="${h(labels)}" title="${h(labels)}（クリックまたはPDF横の緑枠へドラッグ）"></button>`;
      }).join("");
      const allLines = (preview.lines || []).length;
      return `<article class="pdf-click-page"><header><span>${h(page.pageNumber)}ページ／${h(methodLabel(page.method))}</span><span>選択可能 ${allLines}文字ブロック／自動判定 ${mappedLines}</span></header><div class="pdf-click-stage"><img src="${h(preview.imageDataUrl)}" alt="${h(page.pageNumber)}ページ"><div class="pdf-click-overlay">${buttons}</div></div></article>`;
    }).join("");
    analysis.metadata.fields.forEach((field) => {
      field.selected = false;
      field.applied = Boolean(field.autoApplied);
    });
    analysis.candidates.forEach((candidate) => { candidate.selected = false; candidate.applied = false; });
    $("pdfClickWorkbench").hidden = false;
    showEmptyManualMapper();
    updatePdfClickSelection();
    $("pdfClickWorkbench").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addManualCandidate() {
    const primaryLineId = manualItemLineId || manualConsultingTaskLineId || currentManualLineId || manualQuantityLineId || manualConsultingDaysLineId || manualConsultingRoleLineId;
    const line = clickLines.get(primaryLineId);
    if (!line || !currentAnalysis) return;
    const source = { page: line.page, method: line.method, confidence: "medium", sourceText: line.text, selected: true, applied: false, manual: true };
    const editingTarget = currentEditingTarget;
    let target;
    if (isSurveyBusinessKind($("pdfManualKind").value)) {
      const item = activeMaster().workItems.find((entry) => entry.code === $("pdfManualSurveyCode").value);
      if (!item) { app.notify("反映する測量項目を選択してください"); return; }
      if ($("pdfManualSurveyQuantity").value === "") { app.notify("資料の数量を入力してください"); return; }
      if (!$("pdfManualSurveySourceUnit").value) { app.notify("資料の単位を選択してください"); return; }
      const converted = analyzer.convertSurveyQuantity($("pdfManualSurveyQuantity").value, $("pdfManualSurveySourceUnit").value, item);
      const quantity = window.SekisanEngine.normalizeQuantity(converted.quantity, item, activeMaster());
      if (!(quantity > 0)) { app.notify("換算後の積算数量は0より大きい値を入力してください"); return; }
      if (editingTarget) {
        Object.assign(editingTarget.item, { kind: "survey", code: item.code, label: item.name, unit: item.unit, quantity, sourceQuantity: converted.rawQuantity, sourceUnitId: converted.sourceUnitId, sourceUnitLabel: converted.sourceUnitLabel, selected: true });
        target = editingTarget;
      } else {
        const candidate = { ...source, id: `manual-${++manualCandidateSequence}`, kind: "survey", code: item.code, label: item.name, unit: item.unit, quantity, sourceQuantity: converted.rawQuantity, sourceUnitId: converted.sourceUnitId, sourceUnitLabel: converted.sourceUnitLabel };
        currentAnalysis.candidates.push(candidate);
        target = { type: "candidate", item: candidate };
      }
    } else if (isConsultingBusinessKind($("pdfManualKind").value)) {
      const rule = selectedManualConsultingRule();
      const serviceType = rule?.serviceType || "";
      const taskName = rule?.label || "";
      const days = Math.round(Math.max(0, Number($("pdfManualConsultingDays").value) || 0) * 1000) / 1000;
      if (!rule) { app.notify("積算基準の作業区分と作業項目を選択してください"); return; }
      if (days <= 0) { app.notify("人工は0より大きい値を入力してください"); return; }
      if (editingTarget) {
        Object.assign(editingTarget.item, { kind: "consulting", serviceType, taskName, referenceRuleId: rule.id, role: $("pdfManualConsultingRole").value, days, selected: true });
        target = editingTarget;
      } else {
        const candidate = { ...source, id: `manual-${++manualCandidateSequence}`, kind: "consulting", serviceType, taskName, referenceRuleId: rule.id, role: $("pdfManualConsultingRole").value, days };
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
      if (item.kind === "consulting") consulting.push({ ...source, serviceType: item.serviceType, taskName: item.taskName, referenceRuleId: item.referenceRuleId, role: item.role, days: item.days });
      if (item.kind === "consultingCost") costs[item.costKey] = Math.max(0, Math.floor(Number(item.amount) || 0));
    });
    return { selected, survey, consulting, costs, metadata };
  }

  function applyPdfClickSelection() {
    const payload = selectedClickPayload();
    if (!payload.selected.length) return;
    const active = activeMaster();
    const changesMaster = payload.metadata.fiscalYear && payload.metadata.fiscalYear !== active.fiscalYear;
    if (changesMaster && !window.confirm("標準単価セットの年度を切り替えると、現在の積算行の一部が対象外になる場合があります。確認済みの資料年度へ切り替えますか？")) return;
    const metadataResult = app.applyImportedMetadata(payload.metadata);
    if (!metadataResult.masterFound) { app.notify("選択した年度の全国標準単価セットがありません。積算年度を確認してください"); return; }
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
    const submissionName = app.getSubmissionJurisdictionName?.() || "未設定";
    $("importedBasisHint").textContent = `${detected ? `資料候補：${detected}。` : "資料から見積提出先・年度を確定できませんでした。"} 見積提出先：${submissionName}／計算：国土交通省・全国標準 令和${master.fiscalYear - 2018}年度。確認した項目だけ反映します。`;
    const warnings = [...analysis.warnings];
    if (analysis.metadata.fiscalYear && analysis.metadata.fiscalYear !== master.fiscalYear) warnings.push("資料の年度候補と現在の積算年度が異なります。閉じて年度マスターを切り替えてから再度確認してください。");
    if (analysis.metadata.jurisdictionCode && analysis.metadata.jurisdictionCode !== app.getSubmissionJurisdictionCode?.()) warnings.push("資料の発注機関候補と現在の見積提出先が異なります。提出先を確認してください（計算単価には影響しません）。");
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
      const autoProjectName = analysis.metadata.fields.find((field) => field.key === "projectName" && field.autoApply);
      if (autoProjectName && app.applyImportedProjectName(autoProjectName.value)) {
        autoProjectName.autoApplied = true;
        autoProjectName.selected = false;
      }
      if (extracted.pages.some((page) => page.preview?.imageDataUrl)) renderPdfClickWorkbench(extracted, analysis);
      else renderReview(extracted.fileName, analysis);
      if (autoProjectName?.autoApplied) app.notify(`先頭見出しから業務名「${autoProjectName.value}」を4業務共通欄へ自動入力しました`);
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
    const changesMaster = metadata.fiscalYear && metadata.fiscalYear !== active.fiscalYear;
    if (changesMaster && !window.confirm("標準単価セットの年度を切り替えると、現在の積算行の一部が対象外になる場合があります。確認済みの資料年度へ切り替えますか？")) return;
    const metadataResult = app.applyImportedMetadata(metadata);
    if (!metadataResult.masterFound) { app.notify("選択した年度の全国標準単価セットがありません。積算年度を確認してください"); return; }
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
      document.querySelectorAll(".pdf-field-drop-target.drag-over").forEach((target) => target.classList.remove("drag-over"));
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
      document.querySelectorAll(".pdf-field-drop-target.drag-over").forEach((target) => target.classList.remove("drag-over"));
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
    $("pdfManualKind").addEventListener("change", () => {
      updateManualKind();
      clearManualInputValues();
    });
    $("pdfManualKeywordList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-pdf-manual-keyword]");
      if (!button) return;
      const kind = $("pdfManualKind").value;
      activeManualKeywords[kind] = button.dataset.pdfManualKeyword;
      renderManualKeywords();
      if (kind === "survey") {
        $("pdfManualSurveyRegulationGroup").value = "";
        $("pdfManualSurveyCategory").innerHTML = surveyCategoryOptions("", "survey", "");
        $("pdfManualSurveyCategory").value = "";
        populateManualSurveyItems();
      } else if (isConsultingBusinessKind(kind)) {
        $("pdfManualConsultingRuleGroup").value = "";
        updateManualConsultingTasks();
      }
    });
    $("pdfManualSurveyRegulationGroup").addEventListener("change", populateManualSurveyCategories);
    $("pdfManualSurveyCategory").addEventListener("change", populateManualSurveyItems);
    $("pdfManualSurveyCode").addEventListener("change", () => {
      updateManualSurveyRule();
    });
    $("pdfManualSurveySourceUnit").addEventListener("change", () => updateManualSurveyRule($("pdfManualSurveySourceUnit").value));
    $("pdfManualSurveyQuantity").addEventListener("input", (event) => {
      const decimals = decimalsFromStep(event.target.step || 1);
      enforceDecimalInput(event.target, decimals, (value) => analyzer.roundHalfUp ? analyzer.roundHalfUp(Number(value), decimals) : Math.round(Number(value) * 10 ** decimals) / 10 ** decimals);
      updateManualSurveyConversion();
    });
    $("pdfManualConsultingDays").addEventListener("input", (event) => enforceDecimalInput(event.target, 3, (value) => Math.round(Math.max(0, Number(value) || 0) * 1000) / 1000));
    $("pdfManualConsultingRuleGroup").addEventListener("change", () => updateManualConsultingItemsForGroup());
    $("pdfManualConsultingTaskTemplate").addEventListener("change", syncManualConsultingRule);
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
    $("documentImportCandidateList").addEventListener("input", (event) => {
      const row = event.target.closest(".import-candidate");
      if (event.target.classList.contains("import-survey-quantity")) {
        const item = activeMaster().workItems.find((entry) => entry.code === row.querySelector(".import-survey-code").value);
        const rule = window.SekisanEngine.quantityRule(item, activeMaster());
        enforceDecimalInput(event.target, rule.decimals, (value) => window.SekisanEngine.normalizeQuantity(value, item, activeMaster()));
      }
      if (event.target.classList.contains("import-consulting-days")) {
        enforceDecimalInput(event.target, 3, (value) => Math.round(Math.max(0, Number(value) || 0) * 1000) / 1000);
      }
    });
    $("applyDocumentImportButton").addEventListener("click", applyImport);
  }

  async function loadQaImportFixture() {
    if (new URLSearchParams(location.search).get("__qa_import") !== "demo") return;
    document.querySelector('.view-tab[data-view="import"]')?.click();
    const response = await fetch("media/intro-assets/web-sekisan-demo.pdf");
    if (!response.ok) throw new Error(`QA用PDFを取得できません（${response.status}）`);
    const file = new File([await response.blob()], "web-sekisan-demo.pdf", { type: "application/pdf" });
    await analyzeFile(file);
  }

  bindEvents();
  loadQaImportFixture().catch((error) => app.notify(error.message || "QA用PDFを読み込めませんでした"));
})();
