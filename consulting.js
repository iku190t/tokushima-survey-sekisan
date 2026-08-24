(function () {
  "use strict";

  const app = window.EzSekisanApp;
  const master = window.CONSULTING_MASTER;
  const engine = window.ConsultingEngine;
  const pricesByYear = window.OFFICIAL_ROLE_PRICES;
  const standardWalks = window.CONSULTING_STANDARD_WALKS || { presets: [], audits: [] };
  const conditionRules = window.CONSULTING_CONDITION_RULES || { rules: [] };
  const rulePack = window.CONSULTING_RULE_PACK || { rules: [], families: [], audits: [] };
  const officialSourceCatalog = window.OFFICIAL_SOURCE_CATALOG || { sources: [] };
  const complianceCatalog = window.ESTIMATION_COMPLIANCE_CATALOG || { systems: [], regionalAuthorities: [], additionalCostCategories: [], costBuckets: [] };
  const referenceCaseEngine = window.ReferenceCaseEngine;
  if (!app || !master || !engine || !pricesByYear) return;

  const $ = (id) => document.getElementById(id);
  const h = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const money = (value) => `¥${Math.floor(Number(value) || 0).toLocaleString("ja-JP")}`;
  const decimalLabel = (decimals) => `小数第${decimals}位まで`;
  const service = (id) => master.serviceTypes.find((entry) => entry.id === id) || master.serviceTypes[0];
  const roleDefinition = (serviceType, roleId) => (master.roleGroups[service(serviceType).roleGroup] || []).find((entry) => entry.id === roleId)
    || Object.values(master.roleGroups).flat().find((entry) => entry.id === roleId);
  let activeConsultingScope = "design";
  let visiblePresets = [];

  function presetGroup(preset) {
    if (preset?.familyCode) return { id: preset.familyCode, label: `${preset.familyCode}｜${familyForPreset(preset)?.title || "基準書項目"}` };
    const match = String(preset?.label || "").match(/^\s*(\d+)(?:-(\d+))?/);
    if (!match) return { id: "common", label: "共通・その他" };
    const id = match[2] ? `${match[1]}-${match[2]}` : match[1];
    const title = String(preset.label || "").replace(/^\s*\d+(?:-\d+){0,3}\s*/, "").replace(/［表\d+］/g, "").trim();
    const shortTitle = title.length > 24 ? `${title.slice(0, 24)}…` : title;
    return { id, label: `${id}｜${shortTitle || "共通項目"}` };
  }

  function presetRoleSummary(preset) {
    return Object.entries(preset?.roles || {}).map(([roleId, days]) => {
      const role = roleDefinition(preset.serviceType, roleId);
      return `${role?.name || roleId} ${days}人工`;
    }).join("／");
  }

  function serviceInScope(entry) {
    if (activeConsultingScope === "geology") return ["geologyAnalysis", "geologyGeneral"].includes(entry.id);
    if (activeConsultingScope === "planning") return entry.id === "planning";
    return entry.id === "design";
  }

  function scopedServices() {
    return master.serviceTypes.filter(serviceInScope);
  }

  function renderScopeLabels() {
    const geology = activeConsultingScope === "geology";
    const planning = activeConsultingScope === "planning";
    const label = geology ? "地質業務" : planning ? "調査・計画業務" : "設計業務";
    $("consultingScopeTitle").textContent = `${label}の年度別技術者単価と計算方式`;
    $("consultingScopeDescription").textContent = geology
      ? "地質解析は標準数量から人工へ展開し、地質一般調査は市場単価・材料・機械・運搬・仮設を分けて積算します。人工表だけで完結させません。"
      : planning
        ? "調査・計画の種類と標準数量を選び、数量比から職種別人工を算出します。適用外条件は自動計算しません。"
        : "道路・橋梁等の設計種類と標準数量を選び、数量比から職種別人工を算出します。適用条件・追加歩掛を確認して積み上げます。";
    $("consultingAddHeading").textContent = `${label}の条件・数量から積算`;
    $("consultingDetailHeading").textContent = `${label}の職種別内訳`;
    $("consultingEmptyText").textContent = `${label}の業務種類と数量を選ぶと、標準歩掛から職種別人工を算出します。`;
  }

  function state() {
    const estimate = app.getEstimate();
    if (!estimate.consulting) {
      estimate.consulting = { schemaVersion: 3, fiscalYear: 2026, lines: [], additionalCosts: [], compliance: {}, costs: {}, options: {} };
    }
    estimate.consulting.lines = Array.isArray(estimate.consulting.lines) ? estimate.consulting.lines : [];
    estimate.consulting.additionalCosts = Array.isArray(estimate.consulting.additionalCosts) ? estimate.consulting.additionalCosts : [];
    estimate.consulting.compliance = Object.assign({
      standardSystem: "mlit-general", regionalAuthority: "unselected", notificationReference: "", specificationReference: "",
      notificationConfirmed: false, specificationConfirmed: false, priceSourcesConfirmed: false
    }, estimate.consulting.compliance || {});
    estimate.consulting.costs = Object.assign({ designDirectExpenses: 0, surveyPlanningDirectExpenses: 0, geologyDirectNonLabor: 0, geologyIndirect: 0, geologyExcluded: 0 }, estimate.consulting.costs || {});
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

  function renderCompliance() {
    const current = state();
    const compliance = current.compliance;
    $("consultingStandardSystem").innerHTML = complianceCatalog.systems.map((entry) => `<option value="${h(entry.id)}"${entry.selectable ? "" : " disabled"}>${h(entry.name)}${entry.selectable ? "" : "（別基準・計算未対応）"}</option>`).join("");
    $("consultingStandardSystem").value = complianceCatalog.systems.some((entry) => entry.id === compliance.standardSystem && entry.selectable) ? compliance.standardSystem : "mlit-general";
    const selectedSystem = complianceCatalog.systems.find((entry) => entry.id === $("consultingStandardSystem").value);
    $("consultingStandardSystemNote").innerHTML = selectedSystem ? `${h(selectedSystem.note)} <a href="${h(selectedSystem.source)}" target="_blank" rel="noopener noreferrer">公式資料</a>` : "";
    $("consultingRegionalAuthority").innerHTML = complianceCatalog.regionalAuthorities.map((entry) => `<option value="${h(entry.id)}">${h(entry.name)}</option>`).join("");
    $("consultingRegionalAuthority").value = complianceCatalog.regionalAuthorities.some((entry) => entry.id === compliance.regionalAuthority) ? compliance.regionalAuthority : "unselected";
    const selectedAuthority = complianceCatalog.regionalAuthorities.find((entry) => entry.id === $("consultingRegionalAuthority").value);
    $("consultingRegionalAuthorityLink").innerHTML = selectedAuthority?.url ? `<a href="${h(selectedAuthority.url)}" target="_blank" rel="noopener noreferrer">公式サイトで通知・仕様を確認</a>` : "発注機関を選択し、案件の通知・仕様を記録してください。";
    $("consultingNotificationReference").value = compliance.notificationReference || "";
    $("consultingSpecificationReference").value = compliance.specificationReference || "";
    $("consultingNotificationConfirmed").checked = Boolean(compliance.notificationConfirmed);
    $("consultingSpecificationConfirmed").checked = Boolean(compliance.specificationConfirmed);
    $("consultingPriceSourcesConfirmed").checked = Boolean(compliance.priceSourcesConfirmed);
    updateComplianceStatus();
  }

  function updateComplianceStatus() {
    const compliance = state().compliance;
    const complete = compliance.regionalAuthority !== "unselected" && compliance.notificationReference && compliance.specificationReference
      && compliance.notificationConfirmed && compliance.specificationConfirmed && compliance.priceSourcesConfirmed;
    $("consultingComplianceBadge").textContent = complete ? "確認済み" : "未確認あり";
    $("consultingComplianceBadge").classList.toggle("verified", complete);
    $("consultingComplianceStatus").textContent = complete
      ? "発注機関、適用通知、特記仕様、価格根拠の確認記録が揃っています。"
      : "不足項目は提出前チェックとPDF帳票へ未確認として表示します。";
  }

  function additionalCostLabel(collection, id) {
    return collection.find((entry) => entry.id === id)?.name || id;
  }

  function renderAdditionalCosts(result = currentResult()) {
    const current = state();
    $("consultingAdditionalCategory").innerHTML = complianceCatalog.additionalCostCategories.map((entry) => `<option value="${h(entry.id)}">${h(entry.name)}</option>`).join("");
    $("consultingAdditionalBucket").innerHTML = complianceCatalog.costBuckets.map((entry) => `<option value="${h(entry.id)}">${h(entry.name)}</option>`).join("");
    $("consultingAdditionalCostBody").innerHTML = (result.additionalCosts || []).map((entry) => `<tr data-additional-cost="${h(entry.id)}"><td><strong>${h(additionalCostLabel(complianceCatalog.additionalCostCategories, entry.category))}</strong><small>${h(entry.name)}</small></td><td>${h(additionalCostLabel(complianceCatalog.costBuckets, entry.costBucket))}</td><td>${h(entry.quantity)} ${h(entry.unit)}</td><td>${money(entry.unitPrice)}</td><td><strong>${money(entry.amount)}</strong></td><td>${h(entry.source)}${entry.sourceDate ? `<small>${h(entry.sourceDate)}</small>` : ""}</td><td><button class="icon-button danger-text delete-additional-cost" type="button" aria-label="削除">×</button></td></tr>`).join("") || '<tr><td colspan="7" class="empty-report-cell">根拠付き積上げ費用はありません</td></tr>';
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
    $("consultingRoleMeta").textContent = `${role?.name || "職種未選択"}：基準日額 ${money(price)}／人日。人工（補正後数量）は総則に従い小数第3位まで入力します。`;
  }

  function renderPresets() {
    const query = String($("consultingPresetSearch").value || "").trim().toLocaleLowerCase("ja");
    const year = Number(state().fiscalYear);
    const allPresets = Array.isArray(rulePack.rules) && rulePack.rules.length ? rulePack.rules : master.verifiedPresets;
    const candidates = allPresets.filter((preset) =>
      scopedServices().some((entry) => entry.id === preset.serviceType)
      && (!preset.fiscalYear || Number(preset.fiscalYear) === year)
      && (!query || `${preset.label} ${preset.standardUnit || ""} ${preset.source || ""}`.toLocaleLowerCase("ja").includes(query))
    );
    const previousGroup = $("consultingRuleGroup").value;
    const groups = [...new Map(candidates.map((preset) => {
      const group = presetGroup(preset);
      return [group.id, group];
    })).values()].sort((a, b) => a.id.localeCompare(b.id, "ja", { numeric: true }));
    $("consultingRuleGroup").innerHTML = groups.length
      ? groups.map((group) => `<option value="${h(group.id)}">${h(group.label)}</option>`).join("")
      : '<option value="">該当項目なし</option>';
    if (groups.some((group) => group.id === previousGroup)) $("consultingRuleGroup").value = previousGroup;
    const selectedGroup = $("consultingRuleGroup").value;
    const previousPreset = $("consultingPreset").value;
    visiblePresets = candidates.filter((preset) => presetGroup(preset).id === selectedGroup);
    $("consultingPreset").innerHTML = visiblePresets.length
      ? visiblePresets.map((preset) => `<option value="${h(preset.id)}">${h(preset.label)}｜${h(preset.standardUnit || "1業務当り")}</option>`).join("")
      : '<option value="">この業務区分の全国標準参考歩掛は未収録</option>';
    if (visiblePresets.some((preset) => preset.id === previousPreset)) $("consultingPreset").value = previousPreset;
    $("addConsultingPresetButton").disabled = visiblePresets.length === 0;
    const audit = (rulePack.audits || []).find((entry) => Number(entry.fiscalYear) === year);
    $("consultingPresetStatus").textContent = visiblePresets.length
      ? `令和${year - 2018}年度：検索一致 ${candidates.length}歩掛／選択分類 ${visiblePresets.length}歩掛（全区分 ${audit?.ruleCount || candidates.length}歩掛）。国交省本体・累積改定の対応ページと条件表を表示します。`
      : `令和${year - 2018}年度：検索条件に一致する標準歩掛がありません。`;
    renderPresetRule();
  }

  function familyForPreset(preset) {
    return (rulePack.families || []).find((family) => Number(family.fiscalYear) === Number(preset?.fiscalYear)
      && family.serviceType === preset?.serviceType && family.familyCode === preset?.familyCode) || null;
  }

  function sourceLink(source, label = "国交省資料") {
    if (!source?.url) return "";
    const page = source.page ? ` p.${source.page}` : "";
    return `<a href="${h(source.url)}" target="_blank" rel="noopener noreferrer">${h(label)}${h(page)}</a>`;
  }

  function parameterMode(table) {
    const text = (table?.rows || []).flat().join(" ");
    if (/日当たり|日数|作業量/.test(text)) return "productivity";
    if (/%|％|増減率|割増/.test(text)) return "rate";
    if (/補正係数|補正値|係数/.test(text)) return "factor";
    return "reference";
  }

  function numericParameter(cell) {
    const text = String(cell || "").replace(/,/g, "").trim();
    const match = text.match(/^([+－−-]?\d+(?:\.\d+)?)\s*[%％]?$/);
    if (!match) return null;
    return Number(match[1].replace(/[－−]/g, "-"));
  }

  function renderParameterTable(table, index) {
    const mode = parameterMode(table);
    const rows = table.rows || [];
    const trusted = ["high", "medium"].includes(table?.source?.confidence);
    return `<details class="consulting-parameter-table"><summary>条件表 ${index + 1}（${mode === "rate" ? "増減率" : mode === "productivity" ? "日当たり作業量・日数" : mode === "factor" ? "補正係数" : "規格・適用表"}）</summary><div class="parameter-table-scroll"><table><tbody>${rows.map((row, rowIndex) => `<tr>${row.map((cell) => {
      const value = numericParameter(cell);
      const selectable = trusted && mode !== "reference" && rowIndex > 0 && value !== null;
      return `<td>${selectable ? `<button type="button" class="consulting-parameter-value" data-parameter-mode="${mode}" data-parameter-value="${h(value)}" data-parameter-table="${index}">${h(cell)}</button>` : h(cell)}</td>`;
    }).join("")}</tr>`).join("")}</tbody></table></div><small>${trusted ? sourceLink(table.source, "この表の出典") : "低確度・未対応ページのため参照専用（計算選択不可）"}</small></details>`;
  }

  function compileFormula(formula, index) {
    const text = String(formula || "").normalize("NFKC").replace(/・/g, "×").replace(/\s+/g, " ");
    if (/^Mp\s*=/.test(text) || /作業工数|作業歩掛|業務費|消費税/.test(text)) return null;
    let match = text.match(/(?:y|K\d+|補正係数|補正率)\s*=\s*([0-9.]+)\s*[×*]?\s*([A-Za-z]|設計延長|総排水量|橋長|渓流保全工延長)(?:\([^)]*\))?\s*\+\s*([0-9.]+)/i);
    if (match) return { id: `formula-${index}`, formula: text, variable: match[2], a: Number(match[1]), b: Number(match[3]), percent: /%|補正率|橋長補正式/.test(text) };
    match = text.match(/(?:補正係数)\s*=\s*([0-9.]+)\s*\+\s*([0-9.]+)\s*([A-Za-z])/i);
    if (match) return { id: `formula-${index}`, formula: text, variable: match[3], a: Number(match[2]), b: Number(match[1]), percent: false };
    match = text.match(/\(([0-9.]+)\s*\+\s*([0-9.]+)\s*[×*]\s*([nN])\)/);
    if (match) return { id: `formula-${index}`, formula: text, variable: match[3], a: Number(match[2]), b: Number(match[1]), percent: false };
    match = text.match(/\(([0-9.]+)\s*([nN])\s*\+\s*([0-9.]+)\)/);
    if (match) return { id: `formula-${index}`, formula: text, variable: match[2], a: Number(match[1]), b: Number(match[3]), percent: false };
    match = text.match(/1\s*\+\s*\(([nN]\d*)\s*-\s*1\)\s*[×*]\s*([0-9.]+)/);
    if (match) return { id: `formula-${index}`, formula: text, variable: match[1], a: Number(match[2]), b: 1 - Number(match[2]), percent: false };
    return null;
  }

  function renderFormulaCalculator(formulas) {
    const models = formulas.map(compileFormula).filter(Boolean);
    if (!models.length) return "";
    return `<div class="consulting-formula-calculator"><label class="field"><span>適用する補正式</span><select id="consultingFormulaModel"><option value="">適用しない</option>${models.map((model) => `<option value="${h(model.id)}" data-a="${h(model.a)}" data-b="${h(model.b)}" data-percent="${model.percent ? "1" : "0"}" data-variable="${h(model.variable)}">${h(model.formula)}</option>`).join("")}</select></label><label class="field"><span id="consultingFormulaVariableLabel">式の変数</span><input id="consultingFormulaVariable" type="number" min="0" step="0.001" inputmode="decimal" placeholder="式を選択してください" disabled></label><p id="consultingFormulaResult" class="quantity-standard">補正式を選ぶと自動計算します。</p></div>`;
  }

  function renderPresetRule() {
    const preset = visiblePresets.find((entry) => entry.id === $("consultingPreset").value);
    $("consultingConditionsConfirmed").checked = false;
    $("consultingPresetBasis").classList.remove("verified", "reference", "blocked");
    if (!preset) {
      $("consultingPresetBasis").innerHTML = "<strong>適用できる標準歩掛がありません。</strong>";
      $("consultingQuantityFields").innerHTML = "";
      $("consultingConditionFields").innerHTML = "";
      $("addConsultingPresetButton").disabled = true;
      return;
    }
    const quantityRule = engine.parseStandardQuantity(preset.standardUnit, preset.quantitySpec);
    const conditionRule = engine.findConditionRule(preset, conditionRules, state().fiscalYear);
    const family = familyForPreset(preset);
    const coverage = engine.classifyPresetCoverage(preset, conditionRule);
    $("consultingPresetBasis").classList.add(coverage.canCalculate ? "verified" : "blocked");
    const geologyWarning = preset.serviceType === "geologyGeneral"
      ? "<small>地質一般調査は公開された編成人員を人工単価へ置換せず、市場単価を入力して数量・規格・補正から計算します。</small>"
      : "";
    const source = preset.source || {};
    const roleText = preset.serviceType === "geologyGeneral" ? "市場単価方式" : presetRoleSummary(preset);
    $("consultingPresetBasis").innerHTML = `<strong>${h(preset.label)}</strong><span>標準単位：${h(preset.standardUnit || "標準表1式")}／経費体系：${h(preset.costSystem === "survey" ? "測量" : preset.costSystem === "geology" ? "地質一般" : "設計等")}</span><small>${sourceLink(source, `国交省対応ページ（照合${source.confidence === "high" ? "高" : "中"}）`)}</small><small>収録：${h(roleText)}</small>${geologyWarning}`;
    $("consultingQuantityFields").innerHTML = preset.serviceType === "geologyGeneral" ? "" : quantityRule.dimensions.map((dimension) => `<label class="field"><span>${h(dimension.label)}</span><input class="consulting-rule-quantity" data-quantity-key="${h(dimension.key)}" data-quantity-unit="${h(dimension.unit)}" data-quantity-decimals="${h(dimension.decimals)}" type="number" min="${h(dimension.min)}" step="${h(dimension.step)}" inputmode="${dimension.integer ? "numeric" : "decimal"}" placeholder="未入力"${coverage.canCalculate ? "" : " disabled"}><small class="quantity-standard">標準 ${h(dimension.baseQuantity.toLocaleString("ja-JP"))} ${h(dimension.unit)}当り／${h(dimension.integer ? "整数のみ" : `小数第${dimension.decimals}位まで`)}</small></label>`).join("");
    const curated = conditionRule ? `<fieldset><legend>${h(conditionRule.title)}</legend>${(conditionRule.inputs || []).map((input) => input.type === "select-rate"
      ? `<label class="field"><span>${h(input.label)}</span><select class="consulting-rule-condition" data-condition-id="${h(input.id)}"><option value="">選択してください</option>${(input.options || []).map((option) => `<option value="${h(option.value)}">${h(option.label)}（${option.rate >= 0 ? "+" : ""}${h(option.rate * 100)}%）</option>`).join("")}</select>${input.help ? `<small>${h(input.help)}</small>` : ""}</label>`
      : `<label class="check consulting-rate-check"><input class="consulting-rule-condition" data-condition-id="${h(input.id)}" type="checkbox"><span>${h(input.label)}（${input.rate >= 0 ? "+" : ""}${h(input.rate * 100)}%）${input.help ? `<small>${h(input.help)}</small>` : ""}</span></label>`).join("")}<p class="condition-calculation-note">${h(conditionRule.calculationNote)}</p><p id="consultingConditionSummary" class="quantity-standard">必須条件を選択すると補正率を表示します。</p><ul class="condition-source-list">${(conditionRule.sources || []).map((entry) => `<li><a href="${h(entry.url)}" target="_blank" rel="noopener noreferrer">${h(entry.label)} p.${h(entry.pages.join("・"))}</a></li>`).join("")}</ul></fieldset>` : "";
    const familyTrusted = Boolean(family?.sources?.length) && family.sources.every((entry) => ["high", "medium"].includes(entry.confidence));
    const adjustments = conditionRule ? "" : (family?.adjustments || []).map((item, index) => `<label class="check consulting-rate-check"><input class="consulting-family-adjustment" data-adjustment-index="${index}" data-adjustment-type="${h(item.type)}" data-adjustment-value="${h(item.rate ?? item.factor ?? 0)}" type="checkbox"${familyTrusted ? "" : " disabled"}><span>${h(item.text)}（${item.type === "factor-sentence" ? `${item.factor}倍` : `${item.rate >= 0 ? "+" : ""}${engine.roundHalfUp(item.rate * 100, 2)}%`}）${familyTrusted ? "" : "／参照専用"}</span></label>`).join("");
    const parameterTables = conditionRule ? "" : (family?.parameterTables || []).map(renderParameterTable).join("");
    const formulas = (family?.formulas || []).length ? `<details class="consulting-formula-list"><summary>基準書の補正式・数量式</summary><ol>${family.formulas.map((formula) => `<li>${h(formula)}</li>`).join("")}</ol>${conditionRule?.quantityFormula ? `<p class="quantity-standard">数量式は自動反映：${h(conditionRule.quantityFormula.label)}</p>` : familyTrusted ? renderFormulaCalculator(family.formulas) : '<p class="limit-warning">低確度・未対応ページを含むため式は参照専用です。</p>'}</details>` : "";
    const notes = [...(family?.applicability || []), ...(family?.notes || [])];
    const applicability = notes.length ? `<details class="consulting-applicability"><summary>適用範囲・注記（${notes.length}件）</summary><ol>${notes.map((note) => `<li>${h(note)}</li>`).join("")}</ol></details>` : "";
    const selectedParameter = parameterTables ? `<div id="consultingSelectedParameter" class="selected-parameter">条件表の該当値をクリックしてください。複数の増減率は加算し、補正係数は乗算します。</div>` : "";
    const marketUnits = ["m", "m²", "km", "km²", "ha", "m³", "孔", "回", "日", "箇所", "本", "台", "t", "式"];
    const market = preset.serviceType === "geologyGeneral" ? `<fieldset class="consulting-market-fields"><legend>市場単価による積算</legend><label class="field"><span>単位</span><select id="consultingMarketUnit"><option value="">選択してください</option>${marketUnits.map((unit) => `<option value="${h(unit)}">${h(unit)}</option>`).join("")}</select></label><label class="field"><span>数量</span><input id="consultingMarketQuantity" type="number" inputmode="decimal" placeholder="単位を先に選択" disabled><small id="consultingMarketQuantityRule">単位に応じて整数・小数を制限します。</small></label><label class="field"><span>市場単価（円／単位）</span><input id="consultingMarketUnitPrice" type="number" min="1" step="1" inputmode="numeric" placeholder="見積・刊行物の採用単価"></label><label class="field span-2"><span>単価根拠（必須）</span><input id="consultingMarketSource" type="text" placeholder="例：物価資料2026年8月号 p.00／見積書A-01 2026-08-20"></label><small>市場単価は公開基準から推定せず、発注者指定資料・刊行物・見積の名称、年月、ページ又は見積番号を保存します。</small></fieldset>` : "";
    $("consultingConditionFields").innerHTML = `${curated}<fieldset><legend>国交省基準の適用条件・原文</legend>${conditionRule ? "<p>上の構造化済み条件を計算に使用します。重複する原文条件は二重加算しません。</p>" : adjustments || "<p>自動抽出された定率加減条件はありません。</p>"}${parameterTables}${selectedParameter}${formulas}${applicability}${market}</fieldset>`;
    $("consultingConditionsConfirmed").disabled = !coverage.canCalculate;
    $("consultingConditionsLabel").textContent = "表示した適用範囲、条件表、補正式と特記仕様書を確認し、該当する条件だけを選択しました";
    $("addConsultingPresetButton").disabled = !coverage.canCalculate;
    $("addConsultingPresetButton").textContent = preset.serviceType === "geologyGeneral" ? "市場単価・数量を積算へ追加" : "条件・数量から積算へ追加";
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
      const standard = sourceLine?.standardWalk;
      const incomplete = standard && standard.coverageStatus !== "verified-complete";
      const basis = standard?.quantitySummary || (imported ? "資料記載の人工（要照合）" : "基準外・手動調整");
      const readonly = standard ? " readonly" : "";
      const sourceType = standard?.coverageStatus === "verified-complete" ? "原表確認済み" : "全国標準参考";
      if (line.lineType === "amount") return `<tr data-consulting-line="${h(line.id)}">
        <td><strong>${h(line.taskName)}</strong><small>${h(line.serviceName)}／市場単価方式${source ? `／出典：${h(source)}` : ""}</small></td>
        <td><strong>${h(basis)}</strong><small>${h(line.quantity)} ${h(line.unit)} × ${money(line.unitPrice)} × ${h(line.correctionFactor)}倍</small><small>単価根拠：${h(sourceLine?.priceSource || "未記録")}</small></td>
        <td>市場単価</td><td>${h(line.quantity)} ${h(line.unit)}</td><td>${money(line.unitPrice)}</td><td><strong>${money(line.amount)}</strong></td>
        <td class="no-print"><button class="icon-button danger-text delete-consulting-line" type="button" aria-label="削除">×</button></td></tr>`;
      return `<tr data-consulting-line="${h(line.id)}">
        <td><strong>${h(line.taskName)}</strong><small>${h(line.serviceName)}${source ? `／${h(sourceType)}：${h(source)}` : imported ? `／資料取込：${h(imported.fileName || "貼付け原文")} p.${h(imported.page || 1)}（要原文照合）` : "／人工入力"}</small></td>
        <td><strong>${h(basis)}</strong><small>${standard ? incomplete ? standard.conditionRuleId ? "選択した補正規則を反映・人工表原ページは要照合" : "一次試算・補正等未反映" : "原表確認済み条件から自動算出" : "人工を直接入力"}</small></td>
        <td>${h(role?.name || line.role)}</td>
        <td><input class="consulting-line-days" type="number" min="0" step="0.001" inputmode="decimal" data-decimals="3" value="${h(line.days)}"${readonly}><span class="input-unit">人日</span><small>${standard ? "標準歩掛から算出" : "小数第3位まで"}</small></td>
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
    if (!result.lines.length) issues.push("積算内訳がありません。条件・数量から作業を追加してください。");
    if (result.lines.some((line) => line.lineType !== "amount" && !line.dailyRate)) issues.push("基準日額が0円の職種があります。年度単価を確認してください。");
    if (result.lines.some((line) => line.calculationSystem === "geology" && line.lineType !== "amount") && !current.costs.geologyDirectNonLabor && !current.costs.geologyIndirect) issues.push("地質一般調査の機械・材料・運搬・仮設等が0円です。不要か未入力か確認してください。");
    if (current.options.includeSurvey && !app.getSurveyResult().lines.length) issues.push("測量積算を合算する設定ですが、測量作業項目がありません。");
    if (current.lines.some((line) => line.standardWalk && !line.standardWalk.conditionsConfirmed)) issues.push("適用条件の確認が完了していない行があります。");
    if (result.lines.some((line) => !current.lines.find((entry) => entry.id === line.id)?.verifiedSource)) issues.push("人工入力の行があります。採用歩掛と数量条件を積算基準・特記仕様書で照合してください。");
    if (current.compliance.regionalAuthority === "unselected") issues.push("地方整備局等・発注機関が未選択です。");
    if (!current.compliance.notificationReference || !current.compliance.notificationConfirmed) issues.push("発注機関の適用通知・端数運用の確認記録が未完了です。");
    if (!current.compliance.specificationReference || !current.compliance.specificationConfirmed) issues.push("特記仕様書の適用範囲・追加・控除条件の確認記録が未完了です。");
    if (!current.compliance.priceSourcesConfirmed) issues.push("市場単価・材料・機械・運搬・見積の価格根拠確認が未完了です。");
    if ((result.additionalCosts || []).some((entry) => !entry.source)) issues.push("単価根拠がない積上げ費用があります。");
    if (Object.values(current.costs).some((value) => Number(value) > 0)) issues.push("一括入力の積上げ費用があります。提出用には根拠付き費用明細への置換を推奨します。");
    return issues;
  }

  function renderSummary(result) {
    const t = result.totals;
    const rows = [
      ["測量業務価格（合算時）", t.surveyBusinessPrice],
      ["調査計画・測量方式直接費", t.surveyPlanningDirect],
      ["調査計画・測量方式諸経費", t.surveyPlanningOverhead],
      ["調査計画・測量方式業務価格", t.surveyPlanningBusinessPrice, true],
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

  function currentSources() {
    const yearSource = pricesByYear[state().fiscalYear];
    const fiscalYear = Number(state().fiscalYear);
    const mlitSources = (officialSourceCatalog.sources || [])
      .filter((source) => source.jurisdictionCode === "mlit" && Number(source.fiscalYear) === fiscalYear && !String(source.kind).startsWith("role"))
      .map((source) => ({ label: source.title || source.kind, url: source.url }));
    const fullBook = (rulePack.audits || []).find((entry) => Number(entry.fiscalYear) === fiscalYear);
    const baseKinds = activeConsultingScope === "geology"
      ? new Set(["base-geology-standard", "base-reference-geology", "base-reference-general", "reference-amendment-general"])
      : activeConsultingScope === "planning"
        ? new Set(["base-planning-standard", "base-reference-general", "reference-amendment-general"])
        : new Set(["base-design-standard", "base-reference-design", "base-reference-general", "reference-amendment-general"]);
    const baseSources = (officialSourceCatalog.sources || [])
      .filter((source) => source.jurisdictionCode === "mlit" && baseKinds.has(source.kind))
      .map((source) => ({
        label: `${source.title}${source.kind === "reference-amendment-general" ? "（端数規定の改正資料）" : "（基準書本体・継続適用部分）"}`,
        url: source.url
      }));
    return [
      { label: yearSource.sourceLabel, url: yearSource.sourceUrl },
      ...(fullBook ? [{ label: `令和${fiscalYear - 2018}年度 国交省対応済み歩掛 ${fullBook.ruleCount}行（本体・累積改定ページへ照合）`, url: "https://www.mlit.go.jp/tec/gyoumu_sekisan.html" }] : []),
      ...baseSources,
      ...mlitSources,
      { label: "国土交通省 設計業務等標準積算基準書（年度別一覧）", url: "https://www.mlit.go.jp/tec/gyoumu_sekisan.html" }
    ];
  }

  function renderSources() {
    const sources = currentSources();
    $("consultingSourceList").innerHTML = sources.map((source) => `<li><a href="${h(source.url)}" target="_blank" rel="noopener noreferrer">${h(source.label)}</a></li>`).join("");
  }

  function renderAll() {
    renderScopeLabels();
    renderYearAndProject();
    renderCompliance();
    renderServiceControls(false);
    renderPresets();
    renderCostsAndOptions();
    renderSources();
    const result = currentResult();
    renderLines(result);
    renderAdditionalCosts(result);
    renderSummary(result);
  }

  function updateAndRender() {
    app.saveDraft();
    const result = currentResult();
    renderLines(result);
    renderAdditionalCosts(result);
    renderSummary(result);
    renderRoleMeta();
  }

  function enforceDecimalInput(input, decimals, normalizer, announce = false) {
    if (!input || input.value === "") return null;
    const raw = input.value;
    if (["e", "E", "+", "-"].some((token) => raw.includes(token))) {
      input.value = "";
      if (announce) app.notify(`0以上、${decimalLabel(decimals)}で入力してください`);
      return null;
    }
    const fraction = raw.split(".")[1] || "";
    const value = normalizer(raw);
    if (fraction.length > decimals) {
      input.value = String(value);
      if (announce) app.notify(`${decimalLabel(decimals)}に補正しました`);
    }
    return value;
  }

  function configureDomainInput(unitSelect, quantityInput, note) {
    const domain = engine.inputDomainForUnit(unitSelect.value);
    quantityInput.disabled = !unitSelect.value;
    quantityInput.value = "";
    quantityInput.min = String(domain.min);
    quantityInput.step = String(domain.step);
    quantityInput.inputMode = domain.integer ? "numeric" : "decimal";
    quantityInput.dataset.quantityDecimals = String(domain.decimals);
    note.textContent = unitSelect.value ? `${unitSelect.value}：${domain.label}` : "単位に応じて整数・小数を制限";
  }

  function addAdditionalCost() {
    const unit = $("consultingAdditionalUnit").value;
    const validation = engine.validateDomainValue($("consultingAdditionalQuantity").value, unit);
    if (!unit) { app.notify("積上げ費用の単位を選択してください"); return; }
    if (!validation.valid) { app.notify(validation.reason); return; }
    const unitPrice = Math.floor(Number($("consultingAdditionalUnitPrice").value) || 0);
    if (!(unitPrice > 0)) { app.notify("積上げ費用の単価を1円以上で入力してください"); return; }
    const name = $("consultingAdditionalName").value.trim();
    if (!name) { app.notify("費用の名称・規格を入力してください"); return; }
    const source = $("consultingAdditionalSource").value.trim();
    if (!source) { app.notify("刊行物・見積・発注者資料などの単価根拠を入力してください"); return; }
    state().additionalCosts.push({
      id: `additional-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      category: $("consultingAdditionalCategory").value,
      costBucket: $("consultingAdditionalBucket").value,
      name,
      quantity: validation.value,
      unit: validation.domain.unit,
      inputDomain: validation.domain,
      unitPrice,
      source,
      sourceDate: $("consultingAdditionalSourceDate").value
    });
    for (const id of ["consultingAdditionalName", "consultingAdditionalQuantity", "consultingAdditionalUnitPrice", "consultingAdditionalSource", "consultingAdditionalSourceDate"]) $(id).value = "";
    $("consultingAdditionalUnit").value = "";
    configureDomainInput($("consultingAdditionalUnit"), $("consultingAdditionalQuantity"), $("consultingAdditionalQuantityRule"));
    updateAndRender();
    app.notify("根拠付き積上げ費用を追加しました");
  }

  function addLine() {
    const current = state();
    const selectedService = service($("consultingServiceType").value);
    const role = $("consultingRole").value;
    const days = engine.normalizeDays($("consultingDays").value);
    if (!days) { app.notify("人工を0より大きい値で入力してください"); return; }
    current.lines.push({ id: `consult-${Date.now()}-${Math.random().toString(16).slice(2)}`, serviceType: selectedService.id, taskName: $("consultingTaskName").value.trim() || $("consultingTaskTemplate").value, role, days });
    $("consultingDays").value = "";
    updateAndRender();
    app.notify(`${activeConsultingScope === "geology" ? "地質" : activeConsultingScope === "planning" ? "調査・計画" : "設計"}業務の人工を追加しました`);
  }

  function addPreset() {
    const preset = visiblePresets.find((entry) => entry.id === $("consultingPreset").value);
    if (!preset) return;
    const conditionRule = engine.findConditionRule(preset, conditionRules, state().fiscalYear);
    const coverage = engine.classifyPresetCoverage(preset, conditionRule);
    if (!coverage.canCalculate) { app.notify(coverage.note); return; }
    if (!$("consultingConditionsConfirmed").checked) { app.notify("業務種類・適用範囲が特記仕様書と一致することを確認してください"); return; }
    const quantityValues = {};
    document.querySelectorAll(".consulting-rule-quantity").forEach((input) => { quantityValues[input.dataset.quantityKey] = input.value; });
    const marketUnit = String(document.querySelector("#consultingMarketUnit")?.value || "").trim();
    const marketValidation = preset.serviceType === "geologyGeneral"
      ? engine.validateDomainValue(document.querySelector("#consultingMarketQuantity")?.value, marketUnit)
      : null;
    const marketQuantity = marketValidation?.valid ? marketValidation.value : 0;
    const calculation = preset.serviceType === "geologyGeneral"
      ? marketUnit
        ? { valid: Boolean(marketValidation?.valid), reason: marketValidation?.reason || "数量を入力してください", multiplier: 1, quantities: [{ key: "marketQuantity", label: "数量", unit: marketUnit, baseQuantity: 1, quantity: marketQuantity }] }
        : { valid: false, reason: "市場単価の単位を選択してください", multiplier: 0, quantities: [] }
      : engine.calculateStandardQuantity(preset.standardUnit, quantityValues, preset.quantitySpec);
    if (!calculation.valid) { app.notify(calculation.reason); return; }
    const conditionValues = {};
    document.querySelectorAll(".consulting-rule-condition").forEach((input) => { conditionValues[input.dataset.conditionId] = input.type === "checkbox" ? input.checked : input.value; });
    const correction = engine.calculateConditionCorrection(conditionRule, conditionValues);
    if (!correction.valid) { app.notify(correction.reason); return; }
    let genericFactor = 1;
    const genericEntries = [];
    document.querySelectorAll(".consulting-family-adjustment:checked").forEach((input) => {
      const value = Number(input.dataset.adjustmentValue) || 0;
      if (input.dataset.adjustmentType === "factor-sentence") genericFactor *= value;
      else genericFactor *= 1 + value;
      genericEntries.push(input.closest("label")?.innerText?.trim() || "基準書の加減条件");
    });
    let tableRate = 0;
    document.querySelectorAll(".consulting-parameter-value.selected").forEach((button) => {
      const value = Number(button.dataset.parameterValue) || 0;
      if (button.dataset.parameterMode === "rate") tableRate += value / 100;
      else if (button.dataset.parameterMode === "factor") genericFactor *= value;
      genericEntries.push(`${button.dataset.parameterMode === "rate" ? "増減率" : button.dataset.parameterMode === "factor" ? "補正係数" : "日当たり作業量・日数"} ${value}`);
    });
    genericFactor *= 1 + tableRate;
    const formulaResult = document.querySelector("#consultingFormulaResult");
    if (formulaResult?.dataset.factor) {
      const formulaFactor = Number(formulaResult.dataset.factor);
      if (!(formulaFactor > 0)) { app.notify("補正式の計算結果が0以下です"); return; }
      genericFactor *= formulaFactor;
      genericEntries.push(formulaResult.textContent.trim());
    }
    genericFactor = engine.roundHalfUp(genericFactor, 6);
    if (!(genericFactor > 0)) { app.notify("選択条件による補正係数が0以下です"); return; }
    const ruleQuantity = engine.calculateRuleQuantityMultiplier(calculation, conditionRule);
    const multiplier = ruleQuantity.multiplier * correction.factor * genericFactor;
    const genericSummary = genericEntries.length ? `／基準条件 ${genericFactor}倍` : "";
    const baseQuantitySummary = preset.serviceType === "geologyGeneral" ? `市場単価数量 ${marketQuantity} ${calculation.quantities[0].unit}` : ruleQuantity.summary;
    const quantitySummary = `${baseQuantitySummary}${conditionRule ? `／${correction.summary}` : ""}${genericSummary}`;
    if (preset.serviceType === "geologyGeneral") {
      const unitPrice = Math.floor(Number(document.querySelector("#consultingMarketUnitPrice")?.value) || 0);
      if (!(unitPrice > 0)) { app.notify("地質一般調査の市場単価を入力してください"); return; }
      const marketSource = String(document.querySelector("#consultingMarketSource")?.value || "").trim();
      if (!marketSource) { app.notify("市場単価の根拠資料・年月・ページ又は見積番号を入力してください"); return; }
      const quantity = marketQuantity;
      const unit = marketUnit;
      state().lines.push({
        id: `consult-market-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        lineType: "amount",
        serviceType: preset.serviceType,
        costSystem: "geology",
        taskName: preset.label,
        quantity,
        unitPrice,
        unit,
        priceSource: marketSource,
        inputDomain: marketValidation.domain,
        correctionFactor: correction.factor * genericFactor,
        verifiedSource: `${preset.source?.url || ""}${preset.source?.page ? ` p.${preset.source.page}` : ""}`,
        standardWalk: {
          id: preset.id, fiscalYear: preset.fiscalYear, standardUnit: preset.standardUnit,
          quantitySummary, multiplier, correctionFactor: correction.factor * genericFactor,
          conditionEntries: [...correction.entries, ...genericEntries], conditionsConfirmed: true,
          verificationStatus: preset.verificationStatus, coverageStatus: "verified-complete", coverageLabel: coverage.label
        }
      });
      renderPresetRule();
      updateAndRender();
      app.notify(`${quantitySummary}で市場単価項目を追加しました`);
      return;
    }
    Object.entries(preset.roles).forEach(([role, days]) => state().lines.push({
      id: `consult-${Date.now()}-${role}-${Math.random().toString(16).slice(2)}`,
      serviceType: preset.serviceType,
      costSystem: preset.costSystem || "design",
      taskName: preset.label,
      role,
      days: engine.normalizeDays(Number(days) * multiplier),
      verifiedSource: `${preset.source?.url || ""}${preset.source?.page ? ` p.${preset.source.page}` : ""}${conditionRule ? `／補正出典：${conditionRule.sources.map((source) => `${source.label} ${source.url}`).join("、")}` : ""}`,
      standardWalk: {
        id: preset.id,
        fiscalYear: preset.fiscalYear || state().fiscalYear,
        standardUnit: preset.standardUnit || "標準表1式",
        quantities: calculation.quantities.map(({ key, label, unit, baseQuantity, quantity }) => ({ key, label, unit, baseQuantity, quantity })),
        quantitySummary,
        multiplier,
        quantityMultiplier: calculation.multiplier,
        correctionFactor: correction.factor,
        conditionRuleId: conditionRule?.id || null,
        conditionEntries: [...correction.entries, ...genericEntries],
        conditionsConfirmed: true,
        verificationStatus: preset.verificationStatus || "source-table-crosschecked",
        coverageStatus: "verified-complete",
        coverageLabel: coverage.label
      }
    }));
    renderPresetRule();
    updateAndRender();
    app.notify(`${quantitySummary}で条件反映済み歩掛を追加しました`);
  }

  function updateConditionSummary() {
    const preset = visiblePresets.find((entry) => entry.id === $("consultingPreset").value);
    const rule = engine.findConditionRule(preset, conditionRules, state().fiscalYear);
    const target = document.querySelector("#consultingConditionSummary");
    if (!rule || !target) return;
    const values = {};
    document.querySelectorAll(".consulting-rule-condition").forEach((input) => { values[input.dataset.conditionId] = input.type === "checkbox" ? input.checked : input.value; });
    const result = engine.calculateConditionCorrection(rule, values);
    target.textContent = result.valid ? `${result.summary}（${result.entries.map((entry) => `${entry.selection} ${entry.rate >= 0 ? "+" : ""}${entry.rate * 100}%`).join("、")}）` : result.reason;
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
    const rows = result.lines.map((line, index) => {
      const sourceLine = current.lines.find((entry) => entry.id === line.id);
      const standard = sourceLine?.standardWalk;
      const basisBase = standard?.quantitySummary || (sourceLine?.importSource ? "資料記載人工・要照合" : "基準外・手動調整");
      const basis = standard && standard.coverageStatus !== "verified-complete" ? `${basisBase}（${standard.conditionRuleId ? "選択補正反映・未構造化条件は要照合" : "一次試算・補正等未反映"}）` : basisBase;
      const priceSource = line.lineType === "amount" ? `／単価根拠：${sourceLine?.priceSource || "未記録"}` : "";
      return `<tr><td>${index + 1}</td><td>${h(line.serviceName)}</td><td>${h(line.taskName)}</td><td>${h(basis + priceSource)}</td><td>${h(line.lineType === "amount" ? "市場単価" : roleDefinition(line.serviceType, line.role)?.name || line.role)}</td><td>${h(line.lineType === "amount" ? `${line.quantity} ${line.unit}` : line.days)}</td><td>${money(line.lineType === "amount" ? line.unitPrice : line.dailyRate)}</td><td>${money(line.amount)}</td></tr>`;
    }).join("");
    const sourceRows = currentSources().map((source) => `<li>${h(source.label)}<br><small>${h(source.url)}</small></li>`).join("");
    const additionalRows = (result.additionalCosts || []).map((entry, index) => `<tr><td>${index + 1}</td><td>${h(additionalCostLabel(complianceCatalog.additionalCostCategories, entry.category))}</td><td>${h(entry.name)}</td><td>${h(entry.quantity)} ${h(entry.unit)}</td><td>${money(entry.unitPrice)}</td><td>${money(entry.amount)}</td><td>${h(entry.source)}${entry.sourceDate ? `（${h(entry.sourceDate)}）` : ""}</td></tr>`).join("");
    const compliance = current.compliance;
    const authorityEntry = complianceCatalog.regionalAuthorities.find((entry) => entry.id === compliance.regionalAuthority);
    const complianceRows = [
      ["積算基準体系", additionalCostLabel(complianceCatalog.systems, compliance.standardSystem), true],
      ["地方整備局等・発注機関", authorityEntry?.name || "未選択", compliance.regionalAuthority !== "unselected"],
      ["適用通知・運用資料", compliance.notificationReference || "未記録", compliance.notificationConfirmed],
      ["特記仕様書・案件資料", compliance.specificationReference || "未記録", compliance.specificationConfirmed],
      ["価格根拠確認", compliance.priceSourcesConfirmed ? "確認済み" : "未確認", compliance.priceSourcesConfirmed]
    ].map(([label, value, confirmed]) => `<tr><td>${h(label)}</td><td>${h(value)}</td><td>${confirmed ? "確認済み" : "未確認"}</td></tr>`).join("");
    const header = (title) => `<header class="report-page-header"><div><p>測量・調査・設計業務 提出用帳票</p><h1>${h(title)}</h1><span>令和${current.fiscalYear - 2018}年度／${h(authority)}</span></div><div class="report-header-meta"><span>${h(issueDate)}</span></div></header>`;
    const footer = (label) => `<footer class="report-page-footer"><span>${h(estimate.projectName || "総合業務積算")}</span><span>参考試算・公式資料要照合 ／ ${h(label)}</span></footer>`;
    const info = estimate.projectInfo || {};
    const projectRows = [["業務名", estimate.projectName], ["発注者", info.orderingParty], ["担当部署", info.department], ["担当者", info.contactName], ["業務場所", info.workLocation], ["履行期間", info.contractPeriod], ["文書・業務番号", info.documentNumber], ["公告・資料日", info.documentDate], ["積算日", issueDate]]
      .filter(([, value]) => String(value || "").trim()).map(([label, value]) => `<div><dt>${h(label)}</dt><dd>${h(value)}</dd></div>`).join("");
    const summaryRows = [
      ["測量業務価格", t.surveyBusinessPrice], ["調査計画（測量方式）業務価格", t.surveyPlanningBusinessPrice], ["設計・調査計画・解析業務価格", t.designBusinessPrice], ["地質一般調査業務価格", t.geologyBusinessPrice], ["総合業務価格", t.businessPrice], ["消費税", t.tax], ["税込合計", t.total]
    ].map(([label, value], index) => `<tr${index >= 3 ? ' class="total-row"' : ""}><td>${h(label)}</td><td>${money(value)}</td></tr>`).join("");
    const pages = `<section class="report-page">${header("総 合 積 算 総 括 表")}<dl class="report-project-meta">${projectRows}</dl><table class="report-table summary-report-table"><thead><tr><th>業務区分</th><th>金額</th></tr></thead><tbody>${summaryRows}</tbody></table><p class="report-caption">地質一般調査諸経費率：${t.geologyTarget ? `${t.geologyOverheadRate.toFixed(1)}%` : "—"} ／ 総合業務価格調整：${money(t.adjustment)}</p>${footer("総合積算総括表")}</section>
      <section class="report-page report-long-table">${header("業 務 費 内 訳 書")}<table class="report-table breakdown-report-table"><thead><tr><th>No.</th><th>業務区分</th><th>作業</th><th>積算条件・数量</th><th>職種</th><th>人工</th><th>日額</th><th>人件費</th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="empty-report-cell">積算内訳がありません</td></tr>'}</tbody></table><section class="report-note-block"><h2>積上げ費用</h2><p>設計等直接経費 ${money(t.designDirectExpenses)}／電子成果品 ${money(t.electronic)}／地質直接調査費（人件費以外） ${money(t.geologyDirectNonLabor)}／地質間接調査費 ${money(t.geologyIndirect)}／諸経費対象外 ${money(t.geologyExcluded)}</p></section><section class="report-note-block source-note"><h2>出典</h2><ul>${sourceRows}</ul></section><p class="report-disclaimer"><strong>参考試算用・公式帳票ではありません。</strong> 数量条件、追加・控除歩掛、市場単価、機械・材料、運搬・仮設、旅費、特記仕様、発注機関の端数運用を最新の公式資料と照合してください。</p>${footer("業務費内訳書")}</section>
      <section class="report-page report-long-table">${header("適 用 条 件 ・ 積 上 費 用 台 帳")}<h2>適用基準・通知・特記仕様</h2><table class="report-table"><thead><tr><th>確認対象</th><th>記録</th><th>状態</th></tr></thead><tbody>${complianceRows}</tbody></table><h2>市場単価・材料・機械・運搬・個別見積</h2><table class="report-table"><thead><tr><th>No.</th><th>区分</th><th>名称・規格</th><th>数量</th><th>単価</th><th>金額</th><th>根拠</th></tr></thead><tbody>${additionalRows || '<tr><td colspan="7" class="empty-report-cell">根拠付き積上げ費用はありません</td></tr>'}</tbody></table>${footer("適用条件・積上費用台帳")}</section>`;
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

  const referenceItemLabels = {
    surveyBusinessPrice: "測量業務価格", designLabor: "設計直接人件費", designBusinessPrice: "設計業務価格",
    surveyPlanningLabor: "調査計画直接人件費", surveyPlanningBusinessPrice: "調査計画業務価格",
    geologyLabor: "地質直接人件費", geologyBusinessPrice: "地質業務価格", businessPrice: "業務価格", tax: "消費税", total: "税込合計"
  };

  function downloadReferenceTemplate() {
    const template = { schemaVersion: 1, caseId: "anonymous-case-001", fiscalYear: state().fiscalYear, expectedTotals: Object.fromEntries(referenceCaseEngine.allowedItems.map((key) => [key, 0])) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(template, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "匿名化正解積算_照合ひな形.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function compareReferenceFile(file) {
    try {
      const comparison = referenceCaseEngine.compare(JSON.parse(await file.text()), currentResult().totals);
      if (!comparison.valid) throw new Error(comparison.reason);
      $("referenceCaseStatus").textContent = comparison.matched ? "全費目一致" : `${comparison.matchedCount}/${comparison.totalCount}件一致`;
      $("referenceCaseStatus").classList.toggle("verified", comparison.matched);
      $("referenceCaseResult").innerHTML = `<table><thead><tr><th>費目</th><th>正解</th><th>現在値</th><th>差額</th><th>判定</th></tr></thead><tbody>${comparison.rows.map((row) => `<tr><td>${h(referenceItemLabels[row.item] || row.item)}</td><td>${money(row.expected)}</td><td>${money(row.actual)}</td><td>${money(row.difference)}</td><td class="${row.matched ? "matched" : "mismatch"}">${row.matched ? "一致" : "不一致"}</td></tr>`).join("")}</tbody></table><p class="field-note">照合ファイルはブラウザー内だけで処理し、保存・送信しません。</p>`;
    } catch (error) {
      $("referenceCaseStatus").textContent = "照合不可";
      $("referenceCaseStatus").classList.remove("verified");
      $("referenceCaseResult").innerHTML = `<p class="validation-warning">${h(error?.message || "正解積算JSONを読み込めませんでした。")}</p>`;
    }
  }

  function bindEvents() {
    $("openReferenceCaseButton").addEventListener("click", () => $("referenceCaseFileInput").click());
    $("downloadReferenceCaseTemplateButton").addEventListener("click", downloadReferenceTemplate);
    $("referenceCaseFileInput").addEventListener("change", (event) => { const file = event.target.files?.[0]; if (file) compareReferenceFile(file); event.target.value = ""; });
    $("consultingStandardSystem").addEventListener("change", (event) => { state().compliance.standardSystem = event.target.value; renderCompliance(); updateAndRender(); });
    $("consultingRegionalAuthority").addEventListener("change", (event) => { state().compliance.regionalAuthority = event.target.value; state().compliance.notificationConfirmed = false; renderCompliance(); updateAndRender(); });
    $("consultingNotificationReference").addEventListener("input", (event) => { state().compliance.notificationReference = event.target.value; state().compliance.notificationConfirmed = false; $("consultingNotificationConfirmed").checked = false; updateComplianceStatus(); updateAndRender(); });
    $("consultingSpecificationReference").addEventListener("input", (event) => { state().compliance.specificationReference = event.target.value; state().compliance.specificationConfirmed = false; $("consultingSpecificationConfirmed").checked = false; updateComplianceStatus(); updateAndRender(); });
    $("consultingNotificationConfirmed").addEventListener("change", (event) => { state().compliance.notificationConfirmed = event.target.checked; renderCompliance(); updateAndRender(); });
    $("consultingSpecificationConfirmed").addEventListener("change", (event) => { state().compliance.specificationConfirmed = event.target.checked; renderCompliance(); updateAndRender(); });
    $("consultingPriceSourcesConfirmed").addEventListener("change", (event) => { state().compliance.priceSourcesConfirmed = event.target.checked; renderCompliance(); updateAndRender(); });
    $("consultingServiceType").addEventListener("change", () => renderServiceControls(true));
    $("consultingTaskTemplate").addEventListener("change", () => { $("consultingTaskName").value = $("consultingTaskTemplate").value; });
    $("consultingPresetSearch").addEventListener("input", renderPresets);
    $("consultingRuleGroup").addEventListener("change", renderPresets);
    $("consultingPreset").addEventListener("change", renderPresetRule);
    $("consultingRole").addEventListener("change", renderRoleMeta);
    $("consultingDays").addEventListener("input", (event) => enforceDecimalInput(event.target, 3, engine.normalizeDays, true));
    $("consultingQuantityFields").addEventListener("input", (event) => {
      if (!event.target.classList.contains("consulting-rule-quantity")) return;
      const decimals = Number(event.target.dataset.quantityDecimals || 0);
      const integer = decimals === 0;
      enforceDecimalInput(event.target, decimals, (value) => integer ? Math.max(0, Math.floor(Number(value) || 0)) : engine.roundHalfUp(Math.max(0, Number(value) || 0), decimals), true);
    });
    $("consultingConditionFields").addEventListener("input", updateConditionSummary);
    $("consultingConditionFields").addEventListener("change", updateConditionSummary);
    $("consultingConditionFields").addEventListener("change", (event) => {
      if (event.target.id !== "consultingMarketUnit") return;
      const input = document.querySelector("#consultingMarketQuantity");
      const note = document.querySelector("#consultingMarketQuantityRule");
      const domain = engine.inputDomainForUnit(event.target.value);
      if (!input || !note) return;
      input.disabled = !event.target.value;
      input.value = "";
      input.min = String(domain.min);
      input.step = String(domain.step);
      input.inputMode = domain.integer ? "numeric" : "decimal";
      input.dataset.quantityDecimals = String(domain.decimals);
      note.textContent = event.target.value ? `${event.target.value}：${domain.label}` : "単位に応じて整数・小数を制限します。";
    });
    $("consultingConditionFields").addEventListener("input", (event) => {
      if (event.target.id !== "consultingMarketQuantity") return;
      const unit = document.querySelector("#consultingMarketUnit")?.value || "";
      const domain = engine.inputDomainForUnit(unit);
      enforceDecimalInput(event.target, domain.decimals, (value) => domain.integer ? Math.max(0, Math.floor(Number(value) || 0)) : engine.roundHalfUp(Math.max(0, Number(value) || 0), domain.decimals), true);
    });
    $("consultingConditionFields").addEventListener("click", (event) => {
      const button = event.target.closest(".consulting-parameter-value");
      if (!button) return;
      const target = document.querySelector("#consultingSelectedParameter");
      if (!target) return;
      button.classList.toggle("selected");
      const selected = [...document.querySelectorAll(".consulting-parameter-value.selected")];
      target.textContent = selected.length ? `採用値：${selected.map((entry) => entry.textContent.trim()).join("、")}` : "条件表の該当値をクリックしてください。";
    });
    $("consultingConditionFields").addEventListener("change", (event) => {
      if (event.target.id !== "consultingFormulaModel") return;
      const option = event.target.selectedOptions[0];
      const input = document.querySelector("#consultingFormulaVariable");
      const label = document.querySelector("#consultingFormulaVariableLabel");
      const result = document.querySelector("#consultingFormulaResult");
      if (!input || !result) return;
      input.disabled = !event.target.value;
      input.value = "";
      label.textContent = event.target.value ? `${option.dataset.variable} の値` : "式の変数";
      result.textContent = event.target.value ? "変数を入力してください。" : "補正式を選ぶと自動計算します。";
      delete result.dataset.factor;
    });
    $("consultingConditionFields").addEventListener("input", (event) => {
      if (event.target.id !== "consultingFormulaVariable") return;
      const select = document.querySelector("#consultingFormulaModel");
      const option = select?.selectedOptions[0];
      const result = document.querySelector("#consultingFormulaResult");
      const value = Number(event.target.value);
      if (!option || !result || !Number.isFinite(value) || value < 0) return;
      const raw = Number(option.dataset.a) * value + Number(option.dataset.b);
      const factor = option.dataset.percent === "1" ? raw / 100 : raw;
      result.dataset.factor = String(factor);
      result.textContent = `${option.textContent}、${option.dataset.variable}=${value} → ${engine.roundHalfUp(factor, 6)}倍`;
    });
    $("consultingFiscalYear").addEventListener("change", (event) => { state().fiscalYear = Number(event.target.value); renderAll(); app.saveDraft(); });
    $("consultingProjectName").addEventListener("input", (event) => { app.getEstimate().projectName = event.target.value; $("projectName").value = event.target.value; app.saveDraft(); });
    $("projectName").addEventListener("input", () => { $("consultingProjectName").value = $("projectName").value; });
    $("addConsultingLineButton").addEventListener("click", addLine);
    $("addConsultingPresetButton").addEventListener("click", addPreset);
    $("consultingAdditionalUnit").addEventListener("change", () => configureDomainInput($("consultingAdditionalUnit"), $("consultingAdditionalQuantity"), $("consultingAdditionalQuantityRule")));
    $("consultingAdditionalQuantity").addEventListener("input", (event) => {
      const domain = engine.inputDomainForUnit($("consultingAdditionalUnit").value);
      enforceDecimalInput(event.target, domain.decimals, (value) => domain.integer ? Math.max(0, Math.floor(Number(value) || 0)) : engine.roundHalfUp(Math.max(0, Number(value) || 0), domain.decimals), true);
    });
    $("addConsultingAdditionalCost").addEventListener("click", addAdditionalCost);
    $("consultingAdditionalCostBody").addEventListener("click", (event) => {
      const button = event.target.closest(".delete-additional-cost");
      if (!button) return;
      const row = button.closest("tr[data-additional-cost]");
      state().additionalCosts = state().additionalCosts.filter((entry) => entry.id !== row?.dataset.additionalCost);
      updateAndRender();
    });
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
    $("consultingLineBody").addEventListener("input", (event) => {
      if (!event.target.classList.contains("consulting-line-days")) return;
      enforceDecimalInput(event.target, 3, engine.normalizeDays, true);
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
      if (!["design", "planning", "geology"].includes(event.detail?.scope)) return;
      activeConsultingScope = event.detail.scope;
      renderAll();
    });
    document.addEventListener("ezsekisan:consultingimport", (event) => importCandidates(event.detail || {}));
    window.addEventListener("afterprint", () => { delete $("printDocument").dataset.mode; });
  }

  bindEvents();
  renderAll();
})();
