(function () {
  "use strict";

  const MASTER_KEY = "surveySekisanMastersV1";
  const ESTIMATE_KEY = "surveySekisanEstimateV1";
  const defaultMasterId = "r8-tokushima-2026";
  const bundledRateYears = [2026, 2025, 2024, 2023, 2022];
  const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
  const numberFormat = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 3 });
  const defaultDocumentTitle = document.title;
  const $ = (id) => document.getElementById(id);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const h = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function quantityRule(item, master = activeMaster()) {
    return window.SekisanEngine.quantityRule(item, master);
  }

  function quantityLabel(rule) {
    return rule.integer ? "整数のみ" : `小数第${rule.decimals}位まで`;
  }

  function quantityInputItem(input) {
    if (input.id === "newItemQuantity") return activeMaster().workItems.find((item) => item.code === $("itemSelect").value);
    const lineId = input.closest("tr")?.dataset.lineId;
    const line = estimate.lines.find((entry) => entry.id === lineId);
    return activeMaster().workItems.find((item) => item.code === line?.code);
  }

  function applyQuantityInputRule(input, item) {
    if (!item) return;
    const rule = quantityRule(item);
    input.step = String(rule.step);
    input.min = String(rule.min);
    input.inputMode = rule.integer ? "numeric" : "decimal";
    input.dataset.quantityDecimals = String(rule.decimals);
    input.setAttribute("aria-description", `${item.unit}は${quantityLabel(rule)}`);
  }

  function normalizeQuantityInput(input, item, announce = false) {
    if (!item || input.value === "") return null;
    const before = input.value;
    const normalized = window.SekisanEngine.normalizeQuantity(before, item, activeMaster());
    input.value = String(normalized);
    if (announce && num(before) !== normalized) showToast(`${item.unit}の数量を${quantityLabel(quantityRule(item))}に補正しました`);
    return normalized;
  }

  function enforceQuantityPrecision(input, item, announce = false) {
    if (!item || input.value === "") return null;
    const rule = quantityRule(item);
    const raw = input.value;
    const fraction = raw.split(".")[1] || "";
    const exceeds = rule.integer ? raw.includes(".") : fraction.length > rule.decimals;
    const normalized = window.SekisanEngine.normalizeQuantity(raw, item, activeMaster());
    if (exceeds) {
      input.value = String(normalized);
      if (announce) showToast(`${item.unit}の数量は${quantityLabel(rule)}です`);
    }
    return normalized;
  }

  function blockInvalidQuantityKey(event) {
    const input = event.target.closest(".line-quantity, #newItemQuantity");
    if (!input) return;
    const item = quantityInputItem(input);
    if (!item) return;
    const rule = quantityRule(item);
    if (["e", "E", "+", "-"].includes(event.key) || (rule.integer && [".", ","].includes(event.key))) {
      event.preventDefault();
      showToast(`${item.unit}の数量は${quantityLabel(rule)}です`);
    }
  }

  function blockInvalidQuantityPaste(event) {
    const input = event.target.closest(".line-quantity, #newItemQuantity");
    if (!input) return;
    const item = quantityInputItem(input);
    if (!item) return;
    const rule = quantityRule(item);
    const pasted = event.clipboardData?.getData("text")?.trim() || "";
    const pattern = rule.integer ? /^\d+$/ : new RegExp(`^\\d+(?:[.]\\d{0,${rule.decimals}})?$`);
    if (!pattern.test(pasted)) {
      event.preventDefault();
      showToast(`${item.unit}の数量は${quantityLabel(rule)}です`);
    }
  }

  let masters = loadMasters();
  let recoverableDraft = loadSavedEstimate();
  let estimate = emptyEstimate();
  let editorMasterId = estimate.masterId;
  let toastTimer;
  let saveTimer;
  let sessionDirty = false;

  function eraLabel(year) {
    return `令和${year - 2018}年度`;
  }

  function bundledMaster(rateYear = 2026) {
    const master = clone(window.MASTER_R8);
    const preset = window.OFFICIAL_ROLE_PRICES?.[rateYear];
    master.id = rateYear === 2026 ? defaultMasterId : `r8-walk-rate-${rateYear}`;
    master.bundled = true;
    master.walkYear = 2026;
    master.rateYear = rateYear;
    master.scopeStatus = rateYear === 2026 ? "official-r8" : "rate-comparison";
    if (preset) {
      Object.entries(preset.roles).forEach(([key, price]) => {
        if (master.roles[key]) master.roles[key].price = price;
      });
      master.rateSourceUrl = preset.sourceUrl;
      master.rateSourceLabel = preset.sourceLabel;
      master.effectiveFrom = preset.effectiveFrom;
    }
    master.fiscalYear = rateYear;
    master.label = rateYear === 2026
      ? "令和8年度・徳島県測量業務（公式資料収録）"
      : `${eraLabel(rateYear)}技術者単価 × 令和8年度歩掛（比較用）`;
    return master;
  }

  function loadMasters() {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem(MASTER_KEY) || "[]"); } catch (_) { stored = []; }
    if (!Array.isArray(stored)) stored = [];
    const bundledIds = new Set(bundledRateYears.map((year) => year === 2026 ? defaultMasterId : `r8-walk-rate-${year}`));
    const custom = stored.filter((master) => master && !bundledIds.has(master.id));
    return [...bundledRateYears.map((year) => bundledMaster(year)), ...custom];
  }

  function emptyEstimate() {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return {
      schemaVersion: 1,
      masterId: masters[0]?.id || defaultMasterId,
      projectName: "",
      date: localDate,
      memo: "",
      report: defaultReportSettings(localDate),
      lines: [],
      costs: { travel: 0, roundtrip: 0, baseCost: 0, other: 0, inspection: 0 },
      options: { useElectronicDeliverable: true, useFourSignificantDigits: true, adjustBusinessPrice: true, travelMode: "noLodging", safetyRate: 0, taxRate: masters[0]?.taxRate ?? .1 }
    };
  }

  function defaultReportSettings(localDate = "") {
    return {
      clientName: "",
      quoteNumber: "",
      issueDate: localDate,
      validity: "見積日より30日間",
      delivery: "別途協議",
      paymentTerms: "成果品納入・検収後",
      remarks: "",
      companyName: "",
      representative: "",
      postalCode: "",
      address: "",
      phone: "",
      email: "",
      registrationNumber: "",
      sections: { quote: true, summary: true, breakdown: true, unitDetail: false, conditions: false }
    };
  }

  function loadSavedEstimate() {
    try {
      const saved = JSON.parse(localStorage.getItem(ESTIMATE_KEY) || "null");
      if (saved && Array.isArray(saved.lines)) {
        if (!masters.some((master) => master.id === saved.masterId)) saved.masterId = masters[0].id;
        const normalized = Object.assign(emptyEstimate(), saved);
        normalized.costs = Object.assign(emptyEstimate().costs, saved.costs || {});
        normalized.options = Object.assign(emptyEstimate().options, saved.options || {});
        normalized.report = Object.assign(defaultReportSettings(normalized.date), saved.report || {});
        normalized.report.sections = Object.assign(defaultReportSettings().sections, saved.report?.sections || {});
        return normalized;
      }
    } catch (_) { /* use new estimate */ }
    return null;
  }

  function hasDraftContent(draft) {
    if (!draft) return false;
    return Boolean(
      draft.projectName?.trim() || draft.memo?.trim() || draft.lines?.length ||
      Object.values(draft.costs || {}).some((value) => num(value) !== 0)
    );
  }

  function activeMaster() {
    return masters.find((master) => master.id === estimate.masterId) || masters[0];
  }

  function editorMaster() {
    return masters.find((master) => master.id === editorMasterId) || activeMaster();
  }

  function persistMasters() {
    localStorage.setItem(MASTER_KEY, JSON.stringify(masters));
  }

  function persistEstimate() {
    const payload = Object.assign({}, estimate, { autosavedAt: new Date().toISOString() });
    localStorage.setItem(ESTIMATE_KEY, JSON.stringify(payload));
    sessionDirty = false;
    $("saveState").textContent = "保存済み";
  }

  function scheduleSave() {
    sessionDirty = true;
    $("saveState").textContent = "保存中…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistEstimate, 250);
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function renderDraftRecovery() {
    const panel = $("draftRecoveryPanel");
    const available = hasDraftContent(recoverableDraft);
    panel.hidden = !available;
    if (!available) return;
    const name = recoverableDraft.projectName?.trim() || "名称未入力の積算";
    const date = recoverableDraft.autosavedAt ? displayDate(recoverableDraft.autosavedAt.slice(0, 10)) : displayDate(recoverableDraft.date);
    $("draftRecoveryText").textContent = `「${name}」／${date}。必要な場合だけ復元してください。現在の入力画面は新規です。`;
  }

  function restoreSavedDraft() {
    if (!hasDraftContent(recoverableDraft)) return;
    estimate = clone(recoverableDraft);
    editorMasterId = estimate.masterId;
    recoverableDraft = null;
    renderAll();
    renderDraftRecovery();
    persistEstimate();
    showToast("前回の自動保存データを復元しました");
  }

  function dismissSavedDraft() {
    recoverableDraft = null;
    renderDraftRecovery();
    showToast("新規画面のまま続けます");
  }

  function currentResult() {
    const master = activeMaster();
    const prepared = Object.assign({}, estimate, {
      lines: estimate.lines.map((line) => ({ ...line, masterItem: master.workItems.find((item) => item.code === line.code) }))
        .filter((line) => line.masterItem)
    });
    return window.SekisanEngine.calculateEstimate(prepared, master);
  }

  function populateMasterSelects() {
    const options = masters.map((master) => `<option value="${h(master.id)}">${h(master.label)}${master.bundled ? "（初期収録）" : ""}</option>`).join("");
    $("masterSelect").innerHTML = options;
    $("masterEditorSelect").innerHTML = options;
    $("masterSelect").value = estimate.masterId;
    $("masterEditorSelect").value = editorMasterId;
  }

  function renderMasterStatus() {
    const master = activeMaster();
    const strip = document.querySelector(".accuracy-strip");
    strip.classList.toggle("warning", master.scopeStatus !== "official-r8");
    if (master.scopeStatus === "official-r8") {
      $("masterStatusTitle").textContent = "令和8年度・徳島県の公式資料を収録";
      $("masterStatusText").textContent = "歩掛・直接経費率・精度管理費・令和8年度技術者単価を同年度で計算します。案件固有費は提出前チェックに表示します。";
    } else if (master.scopeStatus === "rate-comparison") {
      $("masterStatusTitle").textContent = `${eraLabel(master.rateYear)}の公式技術者単価による比較試算`;
      $("masterStatusText").textContent = `歩掛・経費率は令和8年度のままです。${eraLabel(master.rateYear)}の正式な過去年度積算としては使用できません。`;
    } else {
      $("masterStatusTitle").textContent = "利用者編集マスター";
      $("masterStatusText").textContent = "変更した単価・歩掛・経費率の出典と適用日を確認してから使用してください。";
    }
  }

  function populateCategories() {
    const master = activeMaster();
    const categories = [...new Set(master.workItems.map((item) => item.category))];
    const previous = $("categorySelect").value;
    $("categorySelect").innerHTML = `<option value="">すべての分類</option>` + categories.map((category) => `<option>${h(category)}</option>`).join("");
    if (categories.includes(previous)) $("categorySelect").value = previous;
    populateItems();
    $("itemCountBadge").textContent = `${master.workItems.length}項目収録`;
  }

  function populateItems() {
    const master = activeMaster();
    const category = $("categorySelect").value;
    const previous = $("itemSelect").value;
    const filtered = master.workItems.filter((item) => !category || item.category === category);
    $("itemSelect").innerHTML = filtered.map((item) => `<option value="${h(item.code)}">${h(item.code)}｜${h(item.name)}</option>`).join("");
    if (filtered.some((item) => item.code === previous)) $("itemSelect").value = previous;
    updateSelectedItemMeta();
  }

  function updateSelectedItemMeta() {
    const item = activeMaster().workItems.find((entry) => entry.code === $("itemSelect").value);
    if (!item) { $("selectedItemMeta").textContent = ""; return; }
    $("newItemQuantity").value = item.standardQuantity;
    applyQuantityInputRule($("newItemQuantity"), item);
    const qRule = quantityRule(item);
    const standard = window.SekisanEngine.calculateItem({ masterItem: item, quantity: item.standardQuantity, correctionRate: 0, conditionValue: item.conditionFormula?.default }, activeMaster(), {});
    const limit = item.applicability ? ` ｜ 適用範囲：${item.applicability.note}` : "";
    const condition = item.conditionFormula ? ` ｜ 標準条件：${item.conditionFormula.label}${numberFormat.format(item.conditionFormula.default)}${item.conditionFormula.unit}` : "";
    const ratioSource = item.source.ratioPage ? `・直接経費率 p.${item.source.ratioPage}` : "・直接経費は個別規定";
    const manualNote = item.manualCostNote ? ` ｜ 要確認：${item.manualCostNote}` : "";
    $("selectedItemMeta").textContent = `数量入力：${quantityLabel(qRule)}。標準歩掛は ${numberFormat.format(item.standardQuantity)} ${item.unit} 一式です。標準直接費 ${yen.format(standard.standardDirect)} ÷ ${numberFormat.format(item.standardQuantity)} ${item.unit} → 1${item.unit}当り ${yen.format(standard.standardUnitPrice)}。${condition}${limit}${manualNote} ｜ 出典：基準書 p.${item.source.standardPage}${ratioSource}`;
  }

  function populateSafetyRates() {
    const current = num(estimate.options.safetyRate);
    $("safetyRate").innerHTML = activeMaster().safetyRates.map((entry) => {
      const percent = Number((entry.rate * 100).toFixed(3));
      return `<option value="${entry.rate}">${h(entry.name)}（${percent}%）</option>`;
    }).join("");
    $("safetyRate").value = String(current);
    if ($("safetyRate").selectedIndex < 0) $("safetyRate").value = "0";
  }

  function renderCorrectionRule(rule, line) {
    const current = num(line.correctionSelections?.[rule.id]);
    const selectedIndex = Math.max(0, rule.options.findIndex((option) => option.rate === current));
    const choices = rule.options.map((option, index) => `<option value="${option.rate}" ${index === selectedIndex ? "selected" : ""}>${h(option.label)}（${option.rate >= 0 ? "+" : ""}${(option.rate * 100).toFixed(0)}%）</option>`).join("");
    return `<label class="mini-field">${h(rule.label)} <select class="line-rule" data-rule="${h(rule.id)}">${choices}</select></label>`;
  }

  function renderLines(result) {
    const master = activeMaster();
    $("lineTableBody").innerHTML = result.lines.map((calculated) => {
      const line = estimate.lines.find((entry) => entry.id === calculated.id);
      const item = master.workItems.find((entry) => entry.code === calculated.code);
      const qRule = quantityRule(item, master);
      line.quantity = calculated.quantity;
      const outside = item.applicability && ((Number.isFinite(item.applicability.minimum) && calculated.quantity < item.applicability.minimum) || (Number.isFinite(item.applicability.maximum) && calculated.quantity > item.applicability.maximum));
      const conditionInput = item.conditionFormula ? `<label class="mini-field">${h(item.conditionFormula.label)} <input class="table-input line-condition" type="number" min="0" step=".1" value="${h(line.conditionValue ?? item.conditionFormula.default)}">${h(item.conditionFormula.unit)}</label><small>${h(item.conditionFormula.note)}</small>` : "";
      const rulesInput = (item.correctionRules || []).map((rule) => renderCorrectionRule(rule, line)).join("");
      const precisionInput = item.precisionRateOptions ? `<label class="mini-field">精度係数 <select class="line-precision">${item.precisionRateOptions.map((option) => `<option value="${option.rate}" ${num(line.precisionRate, item.precisionRate) === option.rate ? "selected" : ""}>${h(option.label)} ${(option.rate * 100).toFixed(0)}%</option>`).join("")}</select></label>` : `<small>精度係数：${item.precisionEligible ? `${(calculated.precisionRate * 100).toFixed(0)}%` : "対象外"}</small>`;
      const priceCell = item.pricingMode === "manualUnitPrice" ? `<label class="mini-field">入力単価 <input class="table-input line-manual-price" type="number" min="0" step="1" value="${h(line.manualUnitPrice || 0)}">円</label>` : `<strong>${yen.format(calculated.unitPrice)}</strong><small>1${h(item.unit)}当り</small>`;
      const linearPricing = !item.quantityFormula && !item.expenseFormula && item.pricingMode !== "manualUnitPrice";
      const directFormula = linearPricing
        ? `${yen.format(calculated.unitPrice)} × ${numberFormat.format(calculated.quantity)}${h(item.unit)}`
        : item.pricingMode === "manualUnitPrice" ? "入力単価 × 数量" : "規定の数量補正式で算定";
      const unitAudit = item.pricingMode === "manualUnitPrice"
        ? `<p><b>入力した1${h(item.unit)}当り単価</b>${yen.format(calculated.unitPrice)}</p>`
        : `<p><b>補正後の1${h(item.unit)}当り</b>${yen.format(calculated.rawUnitPrice)} → ${yen.format(calculated.unitPrice)}（${estimate.options.useFourSignificantDigits === false ? "円未満切捨て" : "有効4桁止め"}）</p>`;
      const auditDetail = `<details class="calc-detail"><summary>計算根拠を見る</summary><div class="calc-detail-body">
        <p><b>標準直接人件費</b>${yen.format(calculated.standardLabor)}</p>
        <p><b>標準機械経費</b>${yen.format(calculated.standardMachine)}</p>
        <p><b>標準通信運搬費</b>${yen.format(calculated.standardCommunication)}</p>
        <p><b>標準材料費</b>${yen.format(calculated.standardMaterial)}</p>
        <p class="calc-total"><b>標準 ${numberFormat.format(item.standardQuantity)}${h(item.unit)} の直接費</b>${yen.format(calculated.standardDirect)}</p>
        ${unitAudit}
        <p><b>直接作業費</b>${directFormula} ＝ ${yen.format(calculated.directWork)}</p>
        <p><b>精度管理費</b>(${yen.format(calculated.labor)}＋${yen.format(calculated.machine)}) × ${(calculated.precisionRate * 100).toFixed(0)}% ＝ ${yen.format(calculated.precision)}</p>
        <p class="calc-source">出典：基準書 p.${h(item.source.standardPage)}${item.source.ratioPage ? `／直接経費率 p.${h(item.source.ratioPage)}` : ""}</p>
      </div></details>`;
      return `<tr data-line-id="${h(line.id)}">
        <td><span class="item-name">${h(calculated.name)}</span><span class="item-code">${h(calculated.code)} ｜ 標準歩掛 ${numberFormat.format(item.standardQuantity)} ${h(item.unit)} 一式＝${yen.format(calculated.standardDirect)}</span>${precisionInput}${outside ? `<span class="limit-warning">適用範囲外：${h(item.applicability.note)}</span>` : ""}${item.manualCostNote ? `<span class="limit-warning">${h(item.manualCostNote)}</span>` : ""}${auditDetail}</td>
        <td><input class="table-input line-quantity" type="number" min="${qRule.min}" step="${qRule.step}" inputmode="${qRule.integer ? "numeric" : "decimal"}" data-quantity-decimals="${qRule.decimals}" aria-description="${h(item.unit)}は${h(quantityLabel(qRule))}" value="${h(calculated.quantity)}"><span> ${h(item.unit)}</span><small>${h(quantityLabel(qRule))}</small></td>
        <td>${conditionInput}${rulesInput}<label class="mini-field">手動追加 <span class="percent-wrap"><input class="table-input line-correction" type="number" step=".1" value="${h(num(line.correctionRate) * 100)}"><span>%</span></span></label><small>規定変化率 ${(calculated.ruleCorrectionRate * 100).toFixed(1)}%／適用係数 ${calculated.correctionFactor.toFixed(2)}</small>${item.quantityFormula ? `<small>${h(item.quantityFormula.note)}／数量係数 ${calculated.quantityFactor.toFixed(2)}</small>` : ""}</td>
        <td>${priceCell}</td>
        <td><strong>${yen.format(calculated.directWork)}</strong><small>${directFormula}</small></td>
        <td>${yen.format(calculated.precision)}</td>
        <td class="no-print"><button class="delete-line" type="button" title="削除" aria-label="${h(calculated.name)}を削除">×</button></td>
      </tr>`;
    }).join("");
    $("emptyState").classList.toggle("hidden", result.lines.length > 0);
  }

  function renderSummary(result) {
    const t = result.totals;
    $("totalAmount").textContent = yen.format(t.total);
    const rows = [
      ["直接人件費", t.directLabor],
      ["機械経費", t.machine],
      ["通信運搬費", t.communication],
      ["材料費", t.material],
      ["直接作業費", t.directWork],
      ["精度管理費", t.precision],
      ["電子成果品作成費", t.electronic],
      ["旅費交通費", t.travel],
      ["その他の直接測量費", t.roundtrip + t.baseCost + t.other + t.inspection],
      ["安全費", t.safety],
      ["直接測量費", t.directMeasurement, true],
      ["諸経費", t.overhead],
      ["業務価格", t.businessPrice, true],
      [`消費税（${(t.taxRate * 100).toFixed(1).replace(".0", "")}%）`, t.tax]
    ];
    $("summaryList").innerHTML = rows.map(([label, value, emphasis]) => `<div${emphasis ? ' class="summary-emphasis"' : ""}><dt>${h(label)}</dt><dd>${yen.format(value)}</dd></div>`).join("");
    $("overheadRateDisplay").textContent = t.overheadBase > 0 ? `${t.overheadRate.toFixed(1)}%` : "—";
    renderValidation(result);
  }

  function validationIssues(result) {
    const issues = [];
    const master = activeMaster();
    if (master.scopeStatus === "rate-comparison") issues.push({ severity: "warn", text: "過去年度単価の比較用です。歩掛・経費率は令和8年度です。" });
    if (!result.lines.length) issues.push({ severity: "info", text: "作業項目がまだありません。" });
    result.lines.forEach((calculated) => {
      const item = master.workItems.find((entry) => entry.code === calculated.code);
      const line = estimate.lines.find((entry) => entry.id === calculated.id);
      if (!item || !line) return;
      if (calculated.quantity <= 0) issues.push({ severity: "error", text: `${item.name}：積算数量が0です。` });
      if (item.applicability?.minimum != null && calculated.quantity < item.applicability.minimum) issues.push({ severity: "error", text: `${item.name}：適用下限外（${item.applicability.note}）。` });
      if (item.applicability?.maximum != null && calculated.quantity > item.applicability.maximum) issues.push({ severity: "error", text: `${item.name}：適用上限外（${item.applicability.note}）。` });
      if (item.pricingMode === "manualUnitPrice" && num(line.manualUnitPrice) <= 0) issues.push({ severity: "error", text: `${item.name}：別途算定単価が未入力です。` });
      else if (item.manualCostRequired) issues.push({ severity: "warn", text: `${item.name}：別途計上費・係数を原資料で確認してください。` });
      if (Math.abs(num(line.correctionRate)) > 1e-12) issues.push({ severity: "warn", text: `${item.name}：手動変化率の根拠確認が必要です。` });
    });
    return issues;
  }

  function renderValidation(result) {
    const issues = validationIssues(result);
    const panel = $("validationPanel");
    const hasError = issues.some((issue) => issue.severity === "error");
    const hasWarning = issues.some((issue) => issue.severity === "warn");
    panel.className = `validation-panel ${hasError ? "error" : hasWarning ? "warning" : "good"}`;
    $("validationTitle").textContent = hasError ? "未確定項目があります" : hasWarning ? "確認が必要です" : result.lines.length ? "自動計算範囲は入力済み" : "提出前チェック";
    const visible = issues.slice(0, 5);
    $("validationList").innerHTML = visible.length
      ? visible.map((issue) => `<li>${h(issue.text)}</li>`).join("") + (issues.length > visible.length ? `<li>ほか${issues.length - visible.length}件</li>` : "")
      : "<li>案件の特記仕様書・成果検定費・旅費条件を最終照合してください。</li>";
  }

  function renderEstimate() {
    $("projectName").value = estimate.projectName || "";
    $("estimateDate").value = estimate.date || "";
    $("projectMemo").value = estimate.memo || "";
    document.querySelectorAll(".cost-input").forEach((input) => { input.value = estimate.costs[input.dataset.cost] || ""; });
    $("taxRate").value = num(estimate.options.taxRate, activeMaster().taxRate) * 100;
    $("useElectronic").checked = estimate.options.useElectronicDeliverable !== false;
    $("useFourDigits").checked = estimate.options.useFourSignificantDigits !== false;
    $("adjustBusinessPrice").checked = estimate.options.adjustBusinessPrice !== false;
    $("travelMode").value = estimate.options.travelMode || activeMaster().travel?.defaultMode || "manual";
    populateSafetyRates();
    const result = currentResult();
    renderLines(result);
    renderSummary(result);
    renderMasterStatus();
  }

  function renderReportSettings() {
    const report = estimate.report || (estimate.report = defaultReportSettings(estimate.date));
    document.querySelectorAll(".report-input").forEach((input) => { input.value = report[input.dataset.report] || ""; });
    document.querySelectorAll(".report-section-input").forEach((input) => { input.checked = report.sections?.[input.dataset.section] !== false; });
    renderReportCompleteness();
  }

  function renderReportCompleteness() {
    const report = estimate.report || {};
    const missing = [];
    if (!estimate.projectName?.trim()) missing.push("業務名");
    if (!report.clientName?.trim()) missing.push("宛名");
    if (!report.companyName?.trim()) missing.push("会社名");
    const panel = $("reportCompleteness");
    if (!missing.length) {
      panel.className = "report-completeness good";
      panel.textContent = "提出用の基本情報は入力済みです。積算画面の提出前チェックも確認してください。";
    } else {
      panel.className = "report-completeness warning";
      panel.textContent = `PDF作成前の未入力項目：${missing.join("、")}（空欄のままでも出力できます）`;
    }
  }

  function displayDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return value || "—";
    const [year, month, day] = value.split("-").map(Number);
    return `${year}年${month}月${day}日`;
  }

  function reportHeader(title, subtitle = "") {
    return `<header class="report-page-header"><div><p>測量業務 提出用帳票</p><h1>${h(title)}</h1>${subtitle ? `<span>${h(subtitle)}</span>` : ""}</div><div class="report-header-meta"><b>${h(estimate.report?.quoteNumber || "")}</b><span>${h(displayDate(estimate.report?.issueDate || estimate.date))}</span></div></header>`;
  }

  function reportFooter(label) {
    return `<footer class="report-page-footer"><span>${h(estimate.projectName || "測量業務")}</span><span>参考試算・公式資料要照合 ／ ${h(label)}</span></footer>`;
  }

  function money(value) {
    return yen.format(num(value));
  }

  function renderQuoteReport(result) {
    const report = estimate.report;
    const t = result.totals;
    const issuerLines = [report.companyName, report.representative, report.postalCode, report.address, report.phone && `TEL ${report.phone}`, report.email, report.registrationNumber && `登録番号 ${report.registrationNumber}`].filter(Boolean);
    return `<section class="report-page report-quote-page">
      ${reportHeader("御 見 積 書")}
      <div class="quote-parties"><div class="quote-client"><strong>${h(report.clientName || "（宛名未入力）")}</strong><span>下記のとおりお見積り申し上げます。</span></div><div class="quote-issuer">${issuerLines.map((line, index) => index === 0 ? `<strong>${h(line)}</strong>` : `<span>${h(line)}</span>`).join("") || "<span>（発行者情報未入力）</span>"}</div></div>
      <dl class="quote-main"><div><dt>件名</dt><dd>${h(estimate.projectName || "（業務名未入力）")}</dd></div><div class="quote-total-row"><dt>御見積金額</dt><dd>${money(t.total)}<small>（消費税込）</small></dd></div></dl>
      <table class="report-table quote-summary-table"><thead><tr><th>税抜金額</th><th>消費税（${h((t.taxRate * 100).toFixed(1).replace(".0", ""))}%）</th><th>税込合計</th></tr></thead><tbody><tr><td>${money(t.businessPrice)}</td><td>${money(t.tax)}</td><td class="strong-cell">${money(t.total)}</td></tr></tbody></table>
      <table class="report-table quote-terms-table"><tbody><tr><th>履行期限・納期</th><td>${h(report.delivery || "—")}</td><th>見積有効期限</th><td>${h(report.validity || "—")}</td></tr><tr><th>支払条件</th><td colspan="3">${h(report.paymentTerms || "—")}</td></tr></tbody></table>
      <section class="report-note-block"><h2>見積条件・備考</h2><p>${h(report.remarks || estimate.memo || "特記事項なし").replace(/\n/g, "<br>")}</p></section>
      ${reportFooter("見積書")}
    </section>`;
  }

  function renderSummaryReport(result) {
    const t = result.totals;
    const rows = [
      ["測量作業費", "直接測量費", "直接人件費", t.directLabor],
      ["", "", "機械経費", t.machine], ["", "", "通信運搬費等", t.communication], ["", "", "材料費", t.material],
      ["", "", "端数調整額", t.roundingAdjustment], ["", "", "直接作業費 計", t.directWork],
      ["", "技術管理費", "精度管理費", t.precision], ["", "", "電子成果品作成費", t.electronic],
      ["", "", "旅費交通費", t.travel], ["", "", "往復経費", t.roundtrip], ["", "", "基地関係費", t.baseCost],
      ["", "", "その他", t.other], ["", "", "成果検定費", t.inspection], ["", "", "安全費", t.safety],
      ["", "", "直接測量費 計", t.directMeasurement, true], ["", "間接測量費", "諸経費", t.overhead],
      ["測量業務価格", "", "業務価格", t.businessPrice, true], ["消費税相当額", "", `消費税 ${(t.taxRate * 100).toFixed(1).replace(".0", "")}%`, t.tax],
      ["測量業務費", "", "税込合計", t.total, true]
    ];
    return `<section class="report-page">${reportHeader("積 算 総 括 表", activeMaster().label)}
      <dl class="report-project-meta"><div><dt>業務名</dt><dd>${h(estimate.projectName || "—")}</dd></div><div><dt>積算日</dt><dd>${h(displayDate(estimate.date))}</dd></div></dl>
      <table class="report-table summary-report-table"><thead><tr><th>大区分</th><th>中区分</th><th>費目</th><th>金額</th></tr></thead><tbody>${rows.map(([major, middle, label, value, strong]) => `<tr${strong ? ' class="total-row"' : ""}><td>${h(major)}</td><td>${h(middle)}</td><td>${h(label)}</td><td>${money(value)}</td></tr>`).join("")}</tbody></table>
      <p class="report-caption">諸経費率 ${t.overheadBase > 0 ? `${t.overheadRate.toFixed(1)}%` : "—"} ／ 諸経費対象額 ${money(t.overheadBase)} ／ 千円止め調整 ${money(t.adjustment)}</p>
      ${reportFooter("積算総括表")}</section>`;
  }

  function renderBreakdownReport(result) {
    const groups = new Map();
    result.lines.forEach((line) => {
      if (!groups.has(line.category)) groups.set(line.category, []);
      groups.get(line.category).push(line);
    });
    let rowNumber = 0;
    const workRows = [...groups.entries()].map(([category, lines]) => {
      const detail = lines.map((line) => `<tr><td>${++rowNumber}</td><td><b>${h(line.name)}</b><small>${h(line.code)}／${h(line.category)}</small></td><td>${numberFormat.format(line.quantity)}</td><td>${h(line.unit)}</td><td>${money(line.unitPrice)}</td><td>${money(line.directWork)}</td><td>${money(line.total)}</td></tr>`).join("");
      const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
      return `${detail}<tr class="subtotal-row"><td colspan="6">${h(category)} 小計</td><td>${money(subtotal)}</td></tr>`;
    }).join("");
    const t = result.totals;
    const extraItems = [
      ["電子成果品作成費", t.electronic], ["旅費交通費", t.travel], ["往復経費", t.roundtrip], ["基地関係費", t.baseCost],
      ["その他の直接測量費", t.other], ["成果検定費", t.inspection], ["安全費", t.safety]
    ].filter(([, value]) => num(value) !== 0);
    const extraRows = extraItems.map(([label, value]) => `<tr class="expense-row"><td>—</td><td><b>${h(label)}</b><small>直接測量費</small></td><td>1</td><td>式</td><td>${money(value)}</td><td>${money(value)}</td><td>${money(value)}</td></tr>`).join("");
    const rows = `${workRows}${extraRows}`;
    return `<section class="report-page report-long-table">${reportHeader("業 務 費 内 訳 書", activeMaster().label)}
      <dl class="report-project-meta"><div><dt>業務名</dt><dd>${h(estimate.projectName || "—")}</dd></div></dl>
      <table class="report-table breakdown-report-table"><thead><tr><th>No.</th><th>作業項目</th><th>数量</th><th>単位</th><th>単価</th><th>直接作業費</th><th>金額<br><small>精度管理費含む</small></th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="empty-report-cell">作業項目がありません</td></tr>'}</tbody><tfoot><tr><th colspan="6">直接測量費</th><th>${money(t.directMeasurement)}</th></tr><tr><th colspan="6">諸経費</th><th>${money(t.overhead)}</th></tr><tr><th colspan="6">業務価格（税抜）</th><th>${money(t.businessPrice)}</th></tr><tr><th colspan="6">消費税</th><th>${money(t.tax)}</th></tr><tr class="grand-row"><th colspan="6">税込合計</th><th>${money(t.total)}</th></tr></tfoot></table>
      ${reportFooter("業務費内訳書")}</section>`;
  }

  function renderUnitDetailReport(result) {
    const rows = result.lines.map((line, index) => `<tr><td>${index + 1}</td><td><b>${h(line.name)}</b><small>${h(line.code)}／標準 ${numberFormat.format(line.standardQuantity)}${h(line.unit)}</small></td><td>${money(line.standardLabor)}</td><td>${money(line.standardMachine)}</td><td>${money(line.standardCommunication)}</td><td>${money(line.standardMaterial)}</td><td>${money(line.standardDirect)}</td><td>${h(line.correctionFactor.toFixed(2))}</td><td>${money(line.unitPrice)}</td><td><small>基準書 p.${h(line.source?.standardPage || "—")}${line.source?.ratioPage ? `<br>経費率 p.${h(line.source.ratioPage)}` : ""}</small></td></tr>`).join("");
    return `<section class="report-page report-landscape-page report-long-table">${reportHeader("単 価・歩 掛 内 訳 書", activeMaster().label)}
      <table class="report-table unit-detail-table"><thead><tr><th>No.</th><th>作業項目・標準数量</th><th>人件費</th><th>機械</th><th>通信</th><th>材料</th><th>標準直接費</th><th>補正係数</th><th>1単位単価</th><th>出典</th></tr></thead><tbody>${rows || '<tr><td colspan="10" class="empty-report-cell">作業項目がありません</td></tr>'}</tbody></table>
      <p class="report-caption">人件費・機械・通信・材料は標準数量一式当り。1単位単価は数量補正・変化率・端数処理後の採用値です。</p>${reportFooter("単価・歩掛内訳書")}</section>`;
  }

  function renderConditionsReport(result) {
    const master = activeMaster();
    const issues = validationIssues(result);
    const travelLabels = { noLodging: "宿泊なし（直接人件費×0.56%、上限23万円）", lodging: "宿泊あり（直接人件費×0.83%、上限31.3万円）", manual: "実費積上げ" };
    const conditionRows = [
      ["使用マスター", master.label], ["歩掛年度", eraLabel(master.walkYear || master.fiscalYear)], ["技術者単価年度", eraLabel(master.rateYear || master.fiscalYear)],
      ["適用開始日", displayDate(master.effectiveFrom)], ["積算数量の桁", "点・箇所・回等は整数、km・km²・時間は小数第3位まで"],
      ["測量単価の端数", estimate.options.useFourSignificantDigits === false ? "円未満切捨て" : "有効4桁止め"],
      ["業務価格の端数", estimate.options.adjustBusinessPrice === false ? "円単位" : "千円未満切捨て（諸経費で調整）"],
      ["電子成果品作成費", estimate.options.useElectronicDeliverable === false ? "計上しない" : "自動計上"],
      ["旅費交通費", travelLabels[result.totals.travelMode] || result.totals.travelMode],
      ["安全費", `${(result.totals.safetyRate * 100).toFixed(3).replace(/0+$/, "").replace(/[.]$/, "")}%`], ["消費税率", `${(result.totals.taxRate * 100).toFixed(1).replace(".0", "")}%`]
    ];
    return `<section class="report-page">${reportHeader("積 算 条 件 書", master.label)}
      <table class="report-table conditions-table"><tbody>${conditionRows.map(([label, value]) => `<tr><th>${h(label)}</th><td>${h(value)}</td></tr>`).join("")}</tbody></table>
      <section class="report-note-block"><h2>提出前の確認事項</h2><ul>${issues.length ? issues.map((issue) => `<li>${h(issue.text)}</li>`).join("") : "<li>案件の特記仕様書、成果検定費、旅費条件を最終照合すること。</li>"}</ul></section>
      <section class="report-note-block source-note"><h2>マスター収録出典</h2><ul>${(master.sources || []).map((source) => `<li>${h(source)}</li>`).join("")}</ul></section>
      <p class="report-disclaimer"><strong>参考試算用・公式帳票ではありません。</strong> 本書は選択中の年度マスターと入力条件に基づく積算条件を記録したものです。計算結果等を保証するものではありません。実務利用時は、最新の公式基準、案件固有の特記仕様、貸与資料、現場条件、発注機関の運用および検証済みの正解積算を優先し、利用者の責任で照合してください。</p>
      ${reportFooter("積算条件書")}</section>`;
  }

  function renderPrintDocument() {
    const result = currentResult();
    const sections = estimate.report?.sections || {};
    const pages = [];
    if (sections.quote) pages.push(renderQuoteReport(result));
    if (sections.summary) pages.push(renderSummaryReport(result));
    if (sections.breakdown) pages.push(renderBreakdownReport(result));
    if (sections.unitDetail) pages.push(renderUnitDetailReport(result));
    if (sections.conditions) pages.push(renderConditionsReport(result));
    $("printDocument").innerHTML = pages.join("") || `<section class="report-page">${reportHeader("帳票未選択")}<p class="empty-report-message">帳票・PDF画面で、出力する帳票を1つ以上選択してください。</p></section>`;
  }

  function updateReportSettings() {
    estimate.report = estimate.report || defaultReportSettings(estimate.date);
    document.querySelectorAll(".report-input").forEach((input) => { estimate.report[input.dataset.report] = input.value; });
    document.querySelectorAll(".report-section-input").forEach((input) => { estimate.report.sections[input.dataset.section] = input.checked; });
    renderReportCompleteness();
    scheduleSave();
  }

  function setReportSections(selected) {
    document.querySelectorAll(".report-section-input").forEach((input) => { input.checked = selected.includes(input.dataset.section); });
    updateReportSettings();
  }

  function openReportView() {
    const button = document.querySelector('.view-tab[data-view="report"]');
    button?.click();
    document.querySelector("#reportView")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function printReport() {
    updateReportSettings();
    renderPrintDocument();
    if (!Object.values(estimate.report.sections || {}).some(Boolean)) {
      showToast("出力する帳票を1つ以上選択してください");
      return;
    }
    document.title = `${safeName()}_見積・積算内訳`;
    window.print();
  }

  function renderMasterEditor() {
    const master = editorMaster();
    editorMasterId = master.id;
    $("masterEditorSelect").value = master.id;
    $("masterYear").value = master.fiscalYear;
    $("masterLabel").value = master.label;
    $("masterEffective").value = master.effectiveFrom || "";
    $("rolePriceGrid").innerHTML = Object.entries(master.roles).map(([key, role]) => `<div class="role-price-row"><label for="role-${h(key)}">${h(role.name)}</label><div class="price-input-wrap"><input id="role-${h(key)}" class="role-price-input" data-role="${h(key)}" type="number" min="0" step="100" value="${h(role.price)}"><span>円</span></div></div>`).join("");
    $("masterItemCount").textContent = master.workItems.length;
    $("masterRateYear").textContent = `R${num(master.rateYear, master.fiscalYear) - 2018}`;
    $("masterWalkYear").textContent = `R${num(master.walkYear, master.fiscalYear) - 2018}`;
    $("sourceList").innerHTML = (master.sources || []).map((source) => `<li>${h(source)}</li>`).join("");
    populateOfficialRateSelector(master.rateYear || master.fiscalYear);
  }

  function populateOfficialRateSelector(selectedYear) {
    const presets = window.OFFICIAL_ROLE_PRICES || {};
    $("officialRateYear").innerHTML = Object.keys(presets).sort((a, b) => b - a).map((year) => `<option value="${year}">${h(presets[year].era)}（${h(presets[year].effectiveFrom)}適用）</option>`).join("");
    $("officialRateYear").value = String(presets[selectedYear] ? selectedYear : 2026);
    renderOfficialRateNote();
  }

  function renderOfficialRateNote() {
    const year = num($("officialRateYear").value, 2026);
    const preset = window.OFFICIAL_ROLE_PRICES?.[year];
    const walkYear = num(editorMaster().walkYear, editorMaster().fiscalYear);
    $("officialRateNote").textContent = year === walkYear
      ? `${preset.era}の技術者単価を複製マスターに適用します。歩掛年度と単価年度が一致します。`
      : `${preset.era}の技術者単価だけを適用します。歩掛は令和${walkYear - 2018}年度のままなので、過去年度正式マスターではなく比較試算用です。`;
    $("officialRateSource").href = preset.sourceUrl;
    $("officialRateSource").textContent = preset.sourceLabel;
  }

  function renderAll() {
    populateMasterSelects();
    populateCategories();
    renderEstimate();
    renderMasterEditor();
    renderMasterStatus();
    renderReportSettings();
  }

  function recalculate() {
    const result = currentResult();
    renderLines(result);
    renderSummary(result);
    scheduleSave();
  }

  function addItem() {
    const code = $("itemSelect").value;
    const item = activeMaster().workItems.find((entry) => entry.code === code);
    if (!item) return;
    const quantity = window.SekisanEngine.normalizeQuantity($("newItemQuantity").value, item, activeMaster());
    estimate.lines.push({ id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`, code, quantity, correctionRate: 0, correctionSelections: {}, conditionValue: item.conditionFormula?.default, precisionRate: item.precisionRate, manualUnitPrice: 0 });
    recalculate();
    showToast("作業項目を追加しました");
  }

  function updateEstimateField() {
    estimate.projectName = $("projectName").value;
    estimate.date = $("estimateDate").value;
    estimate.memo = $("projectMemo").value;
    if (!estimate.report.issueDate) estimate.report.issueDate = estimate.date;
    renderReportCompleteness();
    scheduleSave();
  }

  function updateOptions() {
    estimate.options.useElectronicDeliverable = $("useElectronic").checked;
    estimate.options.useFourSignificantDigits = $("useFourDigits").checked;
    estimate.options.adjustBusinessPrice = $("adjustBusinessPrice").checked;
    estimate.options.travelMode = $("travelMode").value;
    estimate.options.safetyRate = num($("safetyRate").value);
    estimate.options.taxRate = num($("taxRate").value) / 100;
    document.querySelectorAll(".cost-input").forEach((input) => { estimate.costs[input.dataset.cost] = Math.max(0, num(input.value)); });
    recalculate();
  }

  function switchMaster(id) {
    const next = masters.find((master) => master.id === id);
    if (!next) return;
    estimate.masterId = id;
    estimate.options.taxRate = next.taxRate;
    estimate.lines = estimate.lines.filter((line) => next.workItems.some((item) => item.code === line.code));
    populateMasterSelects();
    populateCategories();
    renderEstimate();
    renderMasterStatus();
    scheduleSave();
    showToast(`${next.label}に切り替えました`);
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename.replace(/[\\/:*?"<>|]/g, "_");
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
  }

  function safeName() {
    return (estimate.projectName || "測量積算書").trim() || "測量積算書";
  }

  function saveEstimateFile() {
    const payload = clone(estimate);
    payload.exportedAt = new Date().toISOString();
    payload.masterLabel = activeMaster().label;
    download(`${safeName()}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    showToast("積算書JSONを保存しました");
  }

  function importEstimate(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported || !Array.isArray(imported.lines)) throw new Error("形式が違います");
        estimate = Object.assign(emptyEstimate(), imported);
        estimate.costs = Object.assign(emptyEstimate().costs, imported.costs || {});
        estimate.options = Object.assign(emptyEstimate().options, imported.options || {});
        estimate.report = Object.assign(defaultReportSettings(estimate.date), imported.report || {});
        estimate.report.sections = Object.assign(defaultReportSettings().sections, imported.report?.sections || {});
        if (!masters.some((master) => master.id === estimate.masterId)) estimate.masterId = masters[0].id;
        const master = activeMaster();
        let correctedQuantities = 0;
        estimate.lines = estimate.lines.map((line) => {
          const item = master.workItems.find((entry) => entry.code === line.code);
          if (!item) return line;
          const quantity = window.SekisanEngine.normalizeQuantity(line.quantity, item, master);
          if (num(line.quantity) !== quantity) correctedQuantities += 1;
          return { ...line, quantity };
        });
        renderAll();
        persistEstimate();
        showToast(correctedQuantities ? `積算書を読込み、数量${correctedQuantities}件を許容桁に補正しました` : "積算書を読み込みました");
      } catch (error) { alert(`積算書を読み込めませんでした。\n${error.message}`); }
    };
    reader.readAsText(file, "utf-8");
  }

  function exportCsv() {
    const result = currentResult();
    const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const master = activeMaster();
    const rows = [["使用マスター", master.label], ["歩掛年度", master.walkYear || master.fiscalYear], ["技術者単価年度", master.rateYear || master.fiscalYear], [], ["コード", "分類", "作業項目", "標準数量", "積算数量", "単位", "補正率", "標準直接人件費", "標準機械経費", "標準通信運搬費", "標準材料費", "標準直接費", "1単位当り単価", "直接作業費", "精度管理費", "合計", "基準書頁", "直接経費率頁"]];
    result.lines.forEach((line) => rows.push([line.code, line.category, line.name, line.standardQuantity, line.quantity, line.unit, line.totalCorrectionRate, line.standardLabor, line.standardMachine, line.standardCommunication, line.standardMaterial, line.standardDirect, line.unitPrice, line.directWork, line.precision, line.total, line.source?.standardPage || "", line.source?.ratioPage || ""]));
    const t = result.totals;
    rows.push([], ["", "", "直接測量費", "", "", "", "", "", "", t.directMeasurement], ["", "", "諸経費", "", "", "", "", "", "", t.overhead], ["", "", "業務価格", "", "", "", "", "", "", t.businessPrice], ["", "", "消費税", "", "", "", "", "", "", t.tax], ["", "", "税込合計", "", "", "", "", "", "", t.total]);
    download(`${safeName()}.csv`, "\ufeff" + rows.map((row) => row.map(quote).join(",")).join("\r\n"), "text/csv;charset=utf-8");
    showToast("CSVを出力しました");
  }

  function saveMasterMeta() {
    const master = ensureEditableMaster();
    master.fiscalYear = Math.trunc(num($("masterYear").value, master.fiscalYear));
    master.label = $("masterLabel").value.trim() || `${master.fiscalYear}年度マスター`;
    master.effectiveFrom = $("masterEffective").value;
    master.bundled = false;
    persistMasters();
    populateMasterSelects();
    showToast("年度情報を保存しました");
  }

  function saveRolePrices() {
    const master = ensureEditableMaster();
    document.querySelectorAll(".role-price-input").forEach((input) => { master.roles[input.dataset.role].price = Math.max(0, Math.floor(num(input.value))); });
    master.bundled = false;
    persistMasters();
    if (master.id === estimate.masterId) renderEstimate();
    populateMasterSelects();
    showToast("技術者単価を保存しました");
  }

  function ensureEditableMaster() {
    const source = editorMaster();
    if (!source.bundled) return source;
    const copy = clone(source);
    copy.id = `custom-${copy.rateYear || copy.fiscalYear}-${Date.now()}`;
    copy.label = `${copy.label}（編集用）`;
    copy.bundled = false;
    copy.scopeStatus = "user-custom";
    masters.push(copy);
    editorMasterId = copy.id;
    if (estimate.masterId === source.id) estimate.masterId = copy.id;
    return copy;
  }

  function applyOfficialRates() {
    const source = editorMaster();
    const year = num($("officialRateYear").value, 2026);
    const preset = window.OFFICIAL_ROLE_PRICES?.[year];
    if (!preset) return;
    const next = clone(source);
    next.id = `official-rate-${year}-${Date.now()}`;
    next.bundled = false;
    next.rateYear = year;
    next.effectiveFrom = preset.effectiveFrom;
    next.rateSourceUrl = preset.sourceUrl;
    next.rateSourceLabel = preset.sourceLabel;
    Object.entries(preset.roles).forEach(([key, price]) => { if (next.roles[key]) next.roles[key].price = price; });
    const walkYear = num(next.walkYear, next.fiscalYear);
    next.fiscalYear = year;
    next.scopeStatus = year === walkYear ? "user-custom" : "rate-comparison";
    next.label = year === walkYear
      ? `${preset.era}・徳島県測量業務（公式単価適用）`
      : `${preset.era}技術者単価 × 令和${walkYear - 2018}年度歩掛（比較用）`;
    masters.push(next);
    editorMasterId = next.id;
    estimate.masterId = next.id;
    estimate.options.taxRate = next.taxRate;
    persistMasters();
    renderAll();
    scheduleSave();
    showToast(`${preset.era}の公式技術者単価で複製しました`);
  }

  function cloneMasterForNextYear() {
    const source = editorMaster();
    const next = clone(source);
    next.fiscalYear = num(source.fiscalYear) + 1;
    next.label = `${eraLabel(next.fiscalYear)}候補（歩掛・経費率の改定確認前）`;
    next.id = `master-${next.fiscalYear}-${Date.now()}`;
    next.bundled = false;
    next.scopeStatus = "user-custom";
    if (source.effectiveFrom) next.effectiveFrom = `${next.fiscalYear}-${source.effectiveFrom.slice(5)}`;
    masters.push(next);
    editorMasterId = next.id;
    estimate.masterId = next.id;
    estimate.options.taxRate = next.taxRate;
    persistMasters();
    renderAll();
    scheduleSave();
    showToast("翌年度候補を複製しました。歩掛・経費率を更新してください");
  }

  function exportMaster() {
    const master = clone(editorMaster());
    delete master.bundled;
    download(`${master.label}.json`, JSON.stringify(master, null, 2), "application/json;charset=utf-8");
    showToast("年度マスターを書き出しました");
  }

  function importMaster(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const master = JSON.parse(reader.result);
        if (!master || !master.roles || !Array.isArray(master.workItems) || !master.workItems.length) throw new Error("roles または workItems がありません");
        master.id = `import-${master.fiscalYear || "year"}-${Date.now()}`;
        master.label = master.label || `${master.fiscalYear || "新"}年度マスター`;
        master.bundled = false;
        masters.push(master);
        editorMasterId = master.id;
        estimate.masterId = master.id;
        estimate.options.taxRate = num(master.taxRate, .1);
        persistMasters();
        renderAll();
        scheduleSave();
        showToast("年度マスターを読み込みました");
      } catch (error) { alert(`マスターを読み込めませんでした。\n${error.message}`); }
    };
    reader.readAsText(file, "utf-8");
  }

  function deleteMaster() {
    const master = editorMaster();
    if (master.bundled) {
      showToast("初期収録マスターは削除できません");
      return;
    } else {
      if (!confirm(`「${master.label}」を削除しますか？`)) return;
      masters = masters.filter((entry) => entry.id !== master.id);
      if (estimate.masterId === master.id) estimate.masterId = masters[0].id;
      editorMasterId = estimate.masterId;
      showToast("年度マスターを削除しました");
    }
    persistMasters();
    renderAll();
    scheduleSave();
  }

  function bindEvents() {
    const openAboutTool = () => {
      const dialog = $("aboutToolDialog");
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    };
    const openSupportDialog = () => {
      const dialog = $("supportDialog");
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    };
    ["aboutToolButton", "footerAboutToolButton"].forEach((id) => $(id).addEventListener("click", openAboutTool));
    ["publisherSupportButton", "footerSupportButton"].forEach((id) => $(id).addEventListener("click", openSupportDialog));
    $("closeAboutToolButton").addEventListener("click", () => $("aboutToolDialog").close());
    $("aboutToolDialog").addEventListener("click", (event) => { if (event.target === $("aboutToolDialog")) $("aboutToolDialog").close(); });
    $("closeSupportDialogButton").addEventListener("click", () => $("supportDialog").close());
    $("supportDialog").addEventListener("click", (event) => { if (event.target === $("supportDialog")) $("supportDialog").close(); });
    $("supportAboutToolButton").addEventListener("click", () => { $("supportDialog").close(); openAboutTool(); });
    document.querySelectorAll(".view-tab").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll(".view-tab").forEach((entry) => entry.classList.toggle("active", entry === button));
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      $(`${button.dataset.view}View`).classList.add("active");
      if (button.dataset.view === "master") { editorMasterId = estimate.masterId; populateMasterSelects(); renderMasterEditor(); }
      if (button.dataset.view === "report") renderReportSettings();
    }));
    $("categorySelect").addEventListener("change", populateItems);
    $("itemSelect").addEventListener("change", updateSelectedItemMeta);
    $("newItemQuantity").addEventListener("keydown", blockInvalidQuantityKey);
    $("newItemQuantity").addEventListener("paste", blockInvalidQuantityPaste);
    $("newItemQuantity").addEventListener("input", (event) => enforceQuantityPrecision(event.target, quantityInputItem(event.target), true));
    $("newItemQuantity").addEventListener("change", (event) => normalizeQuantityInput(event.target, quantityInputItem(event.target), true));
    $("addItemButton").addEventListener("click", addItem);
    $("masterSelect").addEventListener("change", (event) => switchMaster(event.target.value));
    ["projectName", "estimateDate", "projectMemo"].forEach((id) => $(id).addEventListener("input", updateEstimateField));
    document.querySelectorAll(".cost-input").forEach((input) => input.addEventListener("input", updateOptions));
    ["taxRate", "useElectronic", "useFourDigits", "adjustBusinessPrice", "travelMode", "safetyRate"].forEach((id) => $(id).addEventListener("change", updateOptions));
    $("lineTableBody").addEventListener("input", (event) => {
      const row = event.target.closest("tr");
      const line = estimate.lines.find((entry) => entry.id === row?.dataset.lineId);
      if (!line) return;
      if (event.target.classList.contains("line-quantity")) {
        const item = activeMaster().workItems.find((entry) => entry.code === line.code);
        if (event.target.value !== "") line.quantity = enforceQuantityPrecision(event.target, item, true);
      }
      if (event.target.classList.contains("line-correction")) line.correctionRate = num(event.target.value) / 100;
      if (event.target.classList.contains("line-condition")) line.conditionValue = Math.max(0, num(event.target.value));
      if (event.target.classList.contains("line-manual-price")) line.manualUnitPrice = Math.max(0, num(event.target.value));
      const result = currentResult();
      renderSummary(result);
      scheduleSave();
    });
    $("lineTableBody").addEventListener("keydown", blockInvalidQuantityKey);
    $("lineTableBody").addEventListener("paste", blockInvalidQuantityPaste);
    $("lineTableBody").addEventListener("change", (event) => {
      const row = event.target.closest("tr");
      const line = estimate.lines.find((entry) => entry.id === row?.dataset.lineId);
      if (line && event.target.classList.contains("line-quantity")) {
        const item = activeMaster().workItems.find((entry) => entry.code === line.code);
        line.quantity = normalizeQuantityInput(event.target, item, true);
      }
      if (line && event.target.classList.contains("line-precision")) line.precisionRate = num(event.target.value);
      if (line && event.target.classList.contains("line-rule")) {
        line.correctionSelections = line.correctionSelections || {};
        line.correctionSelections[event.target.dataset.rule] = num(event.target.value);
      }
      renderLines(currentResult());
      renderSummary(currentResult());
      scheduleSave();
    });
    $("lineTableBody").addEventListener("click", (event) => {
      const button = event.target.closest(".delete-line");
      if (!button) return;
      const row = button.closest("tr");
      estimate.lines = estimate.lines.filter((line) => line.id !== row.dataset.lineId);
      recalculate();
    });
    $("newEstimateButton").addEventListener("click", () => {
      if (estimate.lines.length && !confirm("現在の積算内容を消して新規作成しますか？")) return;
      recoverableDraft = null; estimate = emptyEstimate(); editorMasterId = estimate.masterId; renderAll(); renderDraftRecovery(); persistEstimate(); showToast("新しい積算書を作成しました");
    });
    $("restoreDraftButton").addEventListener("click", restoreSavedDraft);
    $("dismissDraftButton").addEventListener("click", dismissSavedDraft);
    $("saveEstimateButton").addEventListener("click", saveEstimateFile);
    $("loadEstimateButton").addEventListener("click", () => $("estimateFileInput").click());
    $("estimateFileInput").addEventListener("change", (event) => { if (event.target.files[0]) importEstimate(event.target.files[0]); event.target.value = ""; });
    $("exportCsvButton").addEventListener("click", exportCsv);
    $("printButton").addEventListener("click", openReportView);
    document.querySelectorAll(".report-input, .report-section-input").forEach((input) => input.addEventListener("input", updateReportSettings));
    document.querySelectorAll(".report-section-input").forEach((input) => input.addEventListener("change", updateReportSettings));
    $("selectClientSetButton").addEventListener("click", () => setReportSections(["quote", "summary", "breakdown"]));
    $("selectFullSetButton").addEventListener("click", () => setReportSections(["quote", "summary", "breakdown", "unitDetail", "conditions"]));
    $("previewPrintButton").addEventListener("click", printReport);
    $("masterEditorSelect").addEventListener("change", (event) => { editorMasterId = event.target.value; renderMasterEditor(); });
    $("officialRateYear").addEventListener("change", renderOfficialRateNote);
    $("applyOfficialRatesButton").addEventListener("click", applyOfficialRates);
    $("applyMasterMetaButton").addEventListener("click", saveMasterMeta);
    $("saveRolePricesButton").addEventListener("click", saveRolePrices);
    $("cloneMasterButton").addEventListener("click", cloneMasterForNextYear);
    $("exportMasterButton").addEventListener("click", exportMaster);
    $("importMasterButton").addEventListener("click", () => $("masterFileInput").click());
    $("masterFileInput").addEventListener("change", (event) => { if (event.target.files[0]) importMaster(event.target.files[0]); event.target.value = ""; });
    $("deleteMasterButton").addEventListener("click", deleteMaster);
    window.addEventListener("beforeunload", () => { if (sessionDirty) persistEstimate(); });
    window.addEventListener("beforeprint", renderPrintDocument);
    window.addEventListener("afterprint", () => { document.title = defaultDocumentTitle; });
  }

  bindEvents();
  renderAll();
  renderDraftRecovery();
})();
