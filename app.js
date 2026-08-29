(function () {
  "use strict";

  const MASTER_KEY = "surveySekisanMastersV1";
  const ESTIMATE_KEY = "surveySekisanEstimateV1";
  const ISSUER_PROFILE_KEY = "surveySekisanIssuerProfileV1";
  const issuerProfileFields = ["companyName", "representative", "postalCode", "address", "phone", "email", "registrationNumber"];
  const defaultMasterId = "standard-r8-2026";
  const legacyMlitMasterId = "r8-mlit-2026-reference";
  const defaultJurisdictionCode = "mlit";
  const masterCatalogPath = "data/master-catalog.json";
  const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
  const numberFormat = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 3 });
  const defaultDocumentTitle = document.title;
  const MOBILE_IMPORT_QUERY = "(max-width: 720px)";
  const officialSourceCatalog = window.OFFICIAL_SOURCE_CATALOG || { sources: [] };
  const $ = (id) => document.getElementById(id);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const h = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const surveyRegulationGroups = [
    { id: "common", label: "積算共通（作業規程の測量種別外）", categories: ["共通"] },
    { id: "control", label: "第2編 基準点測量", categories: ["基準点測量", "水準測量"] },
    { id: "terrain-map", label: "第3編 地形測量及び写真測量", categories: ["現地測量", "空中写真測量"] },
    { id: "terrain-pointcloud", label: "第4編 地形測量及び写真測量（三次元点群測量）", categories: ["地上レーザ測量", "UAV写真点群測量", "UAVレーザ測量", "航空レーザ測量"] },
    { id: "applied", label: "第5編 応用測量", categories: ["路線測量", "河川測量", "深浅測量", "用地測量"] }
  ];
  const surveyKeywordDefinitions = [
    { id: "all", label: "すべて", categories: [] },
    { id: "common", label: "共通", categories: ["共通"] },
    { id: "control", label: "基準点", categories: ["基準点測量"] },
    { id: "level", label: "水準", categories: ["水準測量"] },
    { id: "field", label: "現地", categories: ["現地測量"] },
    { id: "photo", label: "写真", categories: ["空中写真測量"] },
    { id: "pointcloud", label: "UAV・レーザ", categories: ["地上レーザ測量", "UAV写真点群測量", "UAVレーザ測量", "航空レーザ測量"] },
    { id: "route", label: "路線", categories: ["路線測量"] },
    { id: "river", label: "河川", categories: ["河川測量"] },
    { id: "land", label: "用地", categories: ["用地測量"] },
    { id: "bathymetry", label: "深浅", categories: ["深浅測量"] }
  ];
  let activeSurveyKeyword = "all";
  let selectedSurveyQuantityKey = "";

  const surveyRegulationPaths = {
    "共通": "積算基準 第2章 第1節 共通（作業規程の測量種別外）",
    "基準点測量": "作業規程 第2編 第2章 基準点測量",
    "水準測量": "作業規程 第2編 第3章 レベル等による水準測量",
    "現地測量": "作業規程 第3編 第2章 現地測量",
    "空中写真測量": "作業規程 第3編 第4章 空中写真測量",
    "地上レーザ測量": "作業規程 第4編 第2章 地上レーザ点群測量",
    "UAV写真点群測量": "作業規程 第4編 第3章 UAV写真点群測量",
    "UAVレーザ測量": "作業規程 第4編 第4章 UAVレーザ測量",
    "航空レーザ測量": "作業規程 第4編 第6章 航空レーザ測量",
    "路線測量": "作業規程 第5編 第2章 路線測量",
    "河川測量": "作業規程 第5編 第3章 河川測量",
    "深浅測量": "作業規程 第5編 第3章 第7節 深浅測量",
    "用地測量": "作業規程 第5編 第4章 用地測量"
  };

  function regulationGroupForItem(item) {
    return surveyRegulationGroups.find((group) => group.categories.includes(item?.category)) || null;
  }

  function regulationPathForItem(item) {
    return surveyRegulationPaths[item?.category] || "積算基準の作業区分（作業規程との対応要確認）";
  }

  function surveyItemsForScope(master = activeMaster()) {
    return master.workItems;
  }

  function surveyKeywordDefinition(id = activeSurveyKeyword) {
    return surveyKeywordDefinitions.find((entry) => entry.id === id) || surveyKeywordDefinitions[0];
  }

  function surveyItemsForKeyword(items, keywordId = activeSurveyKeyword) {
    const keyword = surveyKeywordDefinition(keywordId);
    return keyword.id === "all" ? items : items.filter((item) => keyword.categories.includes(item.category));
  }

  function renderSurveyKeywords(items) {
    const available = surveyKeywordDefinitions.filter((keyword) => keyword.id === "all" || items.some((item) => keyword.categories.includes(item.category)));
    if (!available.some((keyword) => keyword.id === activeSurveyKeyword)) activeSurveyKeyword = "all";
    $("surveyKeywordList").innerHTML = available.map((keyword) => {
      const count = keyword.id === "all" ? items.length : surveyItemsForKeyword(items, keyword.id).length;
      return `<button class="work-keyword-button" type="button" data-survey-keyword="${h(keyword.id)}" aria-pressed="${keyword.id === activeSurveyKeyword}">${h(keyword.label)}<small>${count}</small></button>`;
    }).join("");
  }

  function renderSurveyScopeLabels() {
    $("surveyWorkItemHeading").textContent = "測量作業項目を追加";
    $("surveyDetailHeading").textContent = "測量業務の積算内訳";
    $("surveyEmptyText").textContent = "上の「測量作業項目を追加」から積算を始めます。";
    $("surveySummaryHeading").textContent = "測量業務の積算結果";
  }

  function quantityRule(item, master = activeMaster()) {
    return window.SekisanEngine.quantityRule(item, master);
  }

  function validatedQuantity(value, item, master = activeMaster()) {
    if (value === "" || value === null || value === undefined) return null;
    const rule = quantityRule(item, master);
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < rule.min) return null;
    if (rule.integer && !Number.isInteger(parsed)) return null;
    if (Math.abs(parsed - Number(parsed.toFixed(rule.decimals))) >= 1e-9) return null;
    return parsed;
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
  const recentlyImportedSurveyLineIds = new Set();

  function eraLabel(year) {
    return `令和${year - 2018}年度`;
  }

  function verificationLabel(master) {
    if (master.verificationStatus === "verified") return "検証済み";
    if (master.verificationStatus === "standard-reference") return "全国標準";
    if (master.verificationStatus === "official-reference") return "公開基準参照・要確認";
    return "利用者作成";
  }

  function sourceListHtml(master) {
    const entries = Array.isArray(master.sourceLinks) && master.sourceLinks.length ? master.sourceLinks : (master.sources || []);
    return entries.map((entry) => {
      if (typeof entry === "string") return `<li>${h(entry)}</li>`;
      const label = h(entry.label || entry.note || "出典");
      const url = String(entry.url || "");
      if (!/^https:\/\//i.test(url)) return `<li>${label}</li>`;
      return `<li><a href="${h(url)}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
    }).join("");
  }

  function sourceTableHtml(master) {
    const entries = Array.isArray(master.sourceLinks) && master.sourceLinks.length ? master.sourceLinks : (master.sources || []);
    return entries.map((entry) => {
      const normalized = typeof entry === "string" ? { label: entry, url: "" } : entry;
      const label = normalized.label || normalized.note || "出典";
      const url = String(normalized.url || "");
      const catalogSource = (officialSourceCatalog.sources || []).find((source) => source.url === url);
      const link = /^https:\/\//i.test(url) ? `<a href="${h(url)}" target="_blank" rel="noopener noreferrer">${h(label)}</a>` : h(label);
      const usage = catalogSource ? officialSourceUsage(catalogSource) : "選択マスターの出典・照合資料";
      const pages = catalogSource?.pages ? `${h(catalogSource.pages)}頁` : "—";
      const [status] = catalogSource ? officialSourceStatus(catalogSource) : ["マスター記載"];
      return `<tr><td>${link}</td><td>${h(usage)}</td><td>${pages}</td><td>${h(status)}</td></tr>`;
    }).join("") || '<tr><td colspan="4">出典資料が登録されていません。</td></tr>';
  }

  const sourceKindLabels = {
    standard: "積算基準書全編",
    reference: "積算基準参考資料",
    "measurement-material": "測量関係資料",
    "measurement-standard": "測量業務積算基準",
    "design-standard": "土木設計業務等積算基準",
    "geology-standard": "地質調査積算基準",
    "reference-amendment": "参考資料改定内容",
    "standard-amendment-1": "標準積算基準書改定内容（1）",
    "standard-amendment-2": "標準積算基準書改定内容（2）",
    "standard-amendment-3": "標準積算基準書改定内容（3）",
    "standard-amendment-4": "標準積算基準書改定内容（4）",
    "role-prices": "設計業務委託等技術者単価"
  };

  function eraYear(year) {
    return `令和${Number(year) - 2018}年度`;
  }

  function officialSourceTitle(source) {
    return source.title || `${eraYear(source.fiscalYear)} ${source.jurisdictionName || "公式公開元"} ${sourceKindLabels[source.kind] || source.kind || "資料"}`;
  }

  function officialSourceUsage(source) {
    if (source.kind === "role-prices") return "技術者の日額単価に使用";
    if (source.jurisdictionCode === "gsi") return "作業規程・測量分類の確認資料";
    if (source.kind === "design-standard") return "設計歩掛の年度改定監査・一部固定値歩掛に使用";
    if (source.kind === "measurement-standard") return "測量歩掛・率の年度改定監査";
    if (source.kind === "geology-standard") return "地質歩掛・諸経費の年度改定監査";
    if (String(source.kind || "").includes("amendment")) return "年度改定差分の監査資料";
    return "原資料台帳・照合資料";
  }

  function officialSourceStatus(source) {
    if (source.kind === "role-prices") return ["計算採用", "verified"];
    if (source.auditStatus === "indexed") return ["取得・索引済み", "indexed"];
    if (source.acquisitionStatus === "acquired") return ["取得済み", "acquired"];
    return ["要確認", "pending"];
  }

  function surveySourceUsage(entry, source) {
    const label = String(entry?.label || "");
    if (label.includes("技術者単価") || source?.kind === "role-prices") return "測量技術者の日額単価";
    if (label.includes("第1編") || source?.kind === "base-measurement-standard") return "全国標準の基準書本体（継続適用部分）";
    if (label.includes("参考資料 第2編") || source?.kind === "base-reference-measurement") return "測量の補正式・適用条件の参考資料";
    if (label.includes("測量業務積算基準") || source?.kind === "measurement-standard") return "当該年度の測量積算基準・改定確認";
    if (label.includes("年度別")) return "国土交通省の年度別公式掲載ページ";
    return "測量マスターの出典・照合資料";
  }

  function selectedSurveySourceRows(master, item) {
    const links = Array.isArray(master.sourceLinks) ? master.sourceLinks.filter((entry) => typeof entry === "object") : [];
    const findLink = (word) => links.find((entry) => String(entry.label || "").includes(word));
    const fullBook = findLink("第1編 測量業務") || links[0];
    const measurementStandard = findLink("測量業務積算基準");
    const rolePrices = findLink("技術者単価");
    const gsiRegulation = (officialSourceCatalog.sources || []).find((source) => source.jurisdictionCode === "gsi" && Number(source.fiscalYear) === Number(master.fiscalYear));
    const sourceLink = (entry, fallback) => entry?.url && /^https:\/\//i.test(entry.url)
      ? `<a href="${h(entry.url)}" target="_blank" rel="noopener noreferrer">${h(entry.label || fallback)}</a>`
      : h(entry?.label || fallback);
    const sourcePage = item?.source?.standardPage ? `p.${h(item.source.standardPage)}${item.source.ratioPage ? `／直接経費率 p.${h(item.source.ratioPage)}` : ""}` : "現行全編の項目別ページ未対応";
    const rows = [
      ["基準書本体・歩掛", sourceLink(fullBook, "国土交通省 標準積算基準書 第1編 測量業務"), sourcePage],
      ["年度の積算基準・改定確認", sourceLink(measurementStandard, `${eraYear(master.fiscalYear)} 国土交通省 測量業務積算基準`), "年度・適用内容を確認"],
      ["技術者単価", sourceLink(rolePrices, `${eraYear(master.fiscalYear)} 設計業務委託等技術者単価`), `${eraYear(master.rateYear || master.fiscalYear)}適用`]
    ];
    if (gsiRegulation) rows.push(["作業規程上の分類", `<a href="${h(gsiRegulation.url)}" target="_blank" rel="noopener noreferrer">${h(officialSourceTitle(gsiRegulation))}</a>`, h(regulationPathForItem(item))]);
    return rows;
  }

  function renderSelectedSurveySources(item) {
    const body = $("selectedItemSourceBody");
    if (!body) return;
    body.innerHTML = item ? selectedSurveySourceRows(activeMaster(), item).map(([use, source, location]) => `<li><strong>${h(use)}</strong>${source}<small>${location}</small></li>`).join("") : "<li>測量項目を選択してください。</li>";
  }

  function renderGuideSourceLedger(resetYear = false) {
    const yearSelect = $("guideSourceYear");
    const body = $("guideSourceLedgerBody");
    if (!yearSelect || !body) return;
    const preferredYear = Number(estimate.consulting?.fiscalYear || activeMaster().fiscalYear || 2026);
    if (resetYear || !yearSelect.value) yearSelect.value = String(preferredYear);
    const fiscalYear = Number(yearSelect.value || preferredYear);
    const surveyMaster = masters.find((master) => Number(master.fiscalYear) === fiscalYear && master.scopeStatus === "national-standard-reference") || activeMaster();
    const rows = (surveyMaster.sourceLinks || []).filter((entry) => typeof entry === "object");
    body.innerHTML = rows.map((entry) => {
      const source = (officialSourceCatalog.sources || []).find((candidate) => candidate.url === entry.url);
      const [status, statusClass] = source ? officialSourceStatus(source) : [String(entry.label || "").includes("年度別") ? "公式掲載ページ" : "マスター記載", "pending"];
      const sha = source?.sha256 ? `<small>SHA-256 ${h(source.sha256.slice(0, 12))}…</small>` : "";
      const link = /^https:\/\//i.test(entry.url || "") ? `<a href="${h(entry.url)}" target="_blank" rel="noopener noreferrer">${h(entry.label || officialSourceTitle(source || {}))}</a>` : h(entry.label || "出典資料");
      return `<tr><td>${h(source?.jurisdictionName || (String(entry.label || "").includes("国土交通省") ? "国土交通省" : surveyMaster.authority || "—"))}</td><td>${link}${sha}</td><td class="source-use-status">${h(surveySourceUsage(entry, source))}</td><td class="source-page">${source?.pages ? `${h(source.pages)}頁` : "—"}</td><td><span class="scope-status ${h(statusClass)}">${h(status)}</span></td></tr>`;
    }).join("") || '<tr><td colspan="5">この年度の公式資料台帳は未収録です。</td></tr>';
    $("guideSourceLedgerSummary").textContent = `${eraYear(fiscalYear)}：この測量マスターが使用・照合する公式PDF・資料 ${rows.length}件。`;
  }

  function jurisdictionName(code) {
    return window.SEKISAN_JURISDICTIONS?.find((entry) => entry.code === String(code))?.name || "地域未設定";
  }

  function submissionJurisdictions() {
    return (window.SEKISAN_JURISDICTIONS || []).filter((entry) => entry.code === "mlit");
  }

  function normalizeSubmissionJurisdictionCode(code) {
    return submissionJurisdictions().some((entry) => entry.code === String(code)) ? String(code) : "";
  }

  function applyVerifiedWorkItemExpansions(master) {
    if (!Array.isArray(master.workItems)) return master;
    (window.SEKISAN_VERIFIED_WORK_ITEM_EXPANSIONS || [])
      .filter((entry) => Number(entry.fiscalYear) === Number(master.fiscalYear))
      .forEach((entry) => {
        const replaceIndex = master.workItems.findIndex((item) => item.code === entry.replaceCode);
        if (replaceIndex < 0 || master.workItems.some((item) => entry.items.some((expanded) => expanded.code === item.code))) return;
        master.workItems.splice(replaceIndex, 1, ...clone(entry.items));
        master.runtimeExpansions = [...(master.runtimeExpansions || []), {
          replaceCode: entry.replaceCode,
          itemCount: entry.items.length,
          sourceLabel: entry.sourceLabel,
          sourceUrl: entry.sourceUrl
        }];
      });
    return master;
  }

  function normalizeMasterMetadata(master, fallbackCode = defaultJurisdictionCode) {
    master.jurisdictionCode = String(master.jurisdictionCode || fallbackCode).padStart(2, "0");
    master.jurisdictionName = jurisdictionName(master.jurisdictionCode);
    master.jurisdictionType = master.jurisdictionCode === "mlit" ? "national" : "prefecture";
    master.verificationStatus = master.verificationStatus || "user-supplied";
    master.scopeStatus = master.scopeStatus === "rate-comparison" ? "retired-comparison" : (master.scopeStatus || "user-custom");
    return applyVerifiedWorkItemExpansions(master);
  }

  function bundledNationalStandardMasters() {
    return (window.SEKISAN_NATIONAL_STANDARD_MASTERS || []).map((entry) => {
      const master = clone(entry);
      master.catalogEntryId = master.id;
      master.catalogManaged = true;
      master.bundled = true;
      master.virtualReference = false;
      return normalizeMasterMetadata(master, "mlit");
    });
  }

  function loadMasters() {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem(MASTER_KEY) || "[]"); } catch (_) { stored = []; }
    if (!Array.isArray(stored)) stored = [];
    const national = bundledNationalStandardMasters();
    const reservedIds = new Set(national.map((master) => master.id));
    const downloadedStandards = stored
      .filter((master) => master && !reservedIds.has(master.id) && master.catalogManaged && master.jurisdictionCode === "mlit" && master.verificationStatus === "standard-reference")
      .map((master) => normalizeMasterMetadata(master, "mlit"));
    const custom = stored
      .filter((master) => master && !reservedIds.has(master.id) && master.id !== legacyMlitMasterId && master.id !== "r8-tokushima-2026" && !master.catalogManaged && master.scopeStatus !== "rate-comparison" && master.scopeStatus !== "retired-comparison" && master.scopeStatus !== "national-standard-reference")
      .map((master) => normalizeMasterMetadata(master));
    return [...national, ...downloadedStandards, ...custom].sort((a, b) => num(b.fiscalYear) - num(a.fiscalYear));
  }

  function emptyEstimate() {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return {
      schemaVersion: 4,
      masterId: masters.find((master) => master.id === defaultMasterId)?.id || masters[0]?.id || defaultMasterId,
      submissionJurisdictionCode: "mlit",
      projectName: "",
      projectInfo: defaultProjectInfo(),
      caseFile: defaultCaseFile(),
      date: localDate,
      memo: "",
      report: defaultReportSettings(localDate),
      lines: [],
      consulting: defaultConsultingState(),
      conditionMemory: defaultConditionMemory(),
      workflowState: defaultWorkflowState(),
      costs: { travel: 0, roundtrip: 0, baseCost: 0, other: 0, inspection: 0 },
      options: { useElectronicDeliverable: true, useFourSignificantDigits: true, adjustBusinessPrice: true, travelMode: "noLodging", safetyRate: 0, taxRate: masters.find((master) => master.id === defaultMasterId)?.taxRate ?? masters[0]?.taxRate ?? .1 }
    };
  }

  function defaultProjectInfo() {
    return { orderingParty: "", department: "", contactName: "", workLocation: "", contractPeriod: "", documentNumber: "", documentDate: "" };
  }

  function defaultCaseFile() {
    return { schemaVersion: 1, sources: [] };
  }

  function defaultConsultingState() {
    return {
      schemaVersion: 1,
      fiscalYear: 2026,
      lines: [],
      costs: { designDirectExpenses: 0, geologyDirectNonLabor: 0, geologyIndirect: 0, geologyExcluded: 0 },
      options: { includeSurvey: false, electronicMode: "none", adjustBusinessPrice: false, taxRate: 0.1 }
    };
  }

  function defaultConditionMemory() {
    return {
      survey: { values: {} },
      design: { values: {} },
      planning: { values: {} },
      geology: { values: {} }
    };
  }

  function normalizedConditionMemory(saved = {}) {
    const defaults = defaultConditionMemory();
    Object.keys(defaults).forEach((scope) => {
      const values = saved?.[scope]?.values;
      if (values && typeof values === "object" && !Array.isArray(values)) defaults[scope].values = clone(values);
    });
    return defaults;
  }

  function defaultWorkflowState() {
    return {
      survey: { keyword: "all", category: "", search: "" },
      consulting: {
        keywords: { design: "all", planning: "all", geology: "all" },
        groups: { design: "", planning: "", geology: "" },
        searches: { design: "", planning: "", geology: "" }
      },
      documentImport: {
        kind: "survey",
        keywords: { design: "all", survey: "all", planning: "all", geology: "all" },
        surveyRegulationGroup: "",
        surveyCategory: "",
        consultingGroups: { design: "", planning: "", geology: "" }
      }
    };
  }

  function normalizedWorkflowState(saved = {}) {
    const defaults = defaultWorkflowState();
    defaults.survey = Object.assign(defaults.survey, saved.survey || {});
    defaults.consulting.keywords = Object.assign(defaults.consulting.keywords, saved.consulting?.keywords || {});
    defaults.consulting.groups = Object.assign(defaults.consulting.groups, saved.consulting?.groups || {});
    defaults.consulting.searches = Object.assign(defaults.consulting.searches, saved.consulting?.searches || {});
    defaults.documentImport = Object.assign(defaults.documentImport, saved.documentImport || {});
    defaults.documentImport.keywords = Object.assign(defaultWorkflowState().documentImport.keywords, saved.documentImport?.keywords || {});
    defaults.documentImport.consultingGroups = Object.assign(defaultWorkflowState().documentImport.consultingGroups, saved.documentImport?.consultingGroups || {});
    return defaults;
  }

  function conditionMemory(scope) {
    estimate.conditionMemory = normalizedConditionMemory(estimate.conditionMemory);
    return estimate.conditionMemory[scope];
  }

  function workflowState() {
    estimate.workflowState = normalizedWorkflowState(estimate.workflowState);
    return estimate.workflowState;
  }

  function emptyIssuerProfile() {
    return Object.fromEntries(issuerProfileFields.map((field) => [field, ""]));
  }

  function loadIssuerProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(ISSUER_PROFILE_KEY) || "null");
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return emptyIssuerProfile();
      return Object.fromEntries(issuerProfileFields.map((field) => [field, String(saved[field] || "").slice(0, 300)]));
    } catch (_) {
      return emptyIssuerProfile();
    }
  }

  function persistIssuerProfile(report = {}) {
    const profile = Object.fromEntries(issuerProfileFields.map((field) => [field, String(report[field] || "").slice(0, 300)]));
    localStorage.setItem(ISSUER_PROFILE_KEY, JSON.stringify(profile));
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
      ...loadIssuerProfile(),
      sections: { quote: true, summary: true, breakdown: true, unitDetail: false, conditions: false }
    };
  }

  function loadSavedEstimate() {
    try {
      const saved = JSON.parse(localStorage.getItem(ESTIMATE_KEY) || "null");
      if (saved && Array.isArray(saved.lines)) {
        if (localStorage.getItem(ISSUER_PROFILE_KEY) === null && issuerProfileFields.some((field) => String(saved.report?.[field] || "").trim())) {
          persistIssuerProfile(saved.report);
        }
        if (saved.masterId === legacyMlitMasterId || saved.masterId === "r8-tokushima-2026") saved.masterId = "standard-r8-2026";
        if (!masters.some((master) => master.id === saved.masterId)) {
          const savedYear = num(saved.masterId?.match(/-(20\d{2})$/)?.[1]);
          saved.masterId = masters.find((master) => master.fiscalYear === savedYear && master.jurisdictionCode === "mlit")?.id || defaultMasterId;
        }
        const normalized = Object.assign(emptyEstimate(), saved);
        normalized.submissionJurisdictionCode = normalizeSubmissionJurisdictionCode(saved.submissionJurisdictionCode);
        normalized.projectInfo = Object.assign(defaultProjectInfo(), saved.projectInfo || {});
        normalized.caseFile = Object.assign(defaultCaseFile(), saved.caseFile || {});
        normalized.caseFile.sources = Array.isArray(saved.caseFile?.sources) ? saved.caseFile.sources : [];
        normalized.costs = Object.assign(emptyEstimate().costs, saved.costs || {});
        normalized.options = Object.assign(emptyEstimate().options, saved.options || {});
        normalized.consulting = Object.assign(defaultConsultingState(), saved.consulting || {});
        normalized.consulting.fiscalYear = Number(masters.find((master) => master.id === normalized.masterId)?.fiscalYear || normalized.consulting.fiscalYear);
        normalized.consulting.lines = Array.isArray(saved.consulting?.lines) ? saved.consulting.lines : [];
        normalized.consulting.costs = Object.assign(defaultConsultingState().costs, saved.consulting?.costs || {});
        normalized.consulting.options = Object.assign(defaultConsultingState().options, saved.consulting?.options || {});
        normalized.conditionMemory = normalizedConditionMemory(saved.conditionMemory);
        normalized.workflowState = normalizedWorkflowState(saved.workflowState);
        normalized.report = Object.assign(defaultReportSettings(normalized.date), saved.report || {});
        normalized.report.sections = Object.assign(defaultReportSettings().sections, saved.report?.sections || {});
        return normalized;
      }
    } catch (_) { /* use new estimate */ }
    return null;
  }

  function hasDraftContent(draft) {
    if (!draft) return false;
    const hasConditionMemory = JSON.stringify(normalizedConditionMemory(draft.conditionMemory)) !== JSON.stringify(defaultConditionMemory());
    const hasWorkflowSelection = JSON.stringify(normalizedWorkflowState(draft.workflowState)) !== JSON.stringify(defaultWorkflowState());
    return Boolean(
      draft.projectName?.trim() || draft.memo?.trim() || Object.values(draft.projectInfo || {}).some((value) => String(value || "").trim()) || draft.caseFile?.sources?.length || draft.lines?.length ||
      draft.consulting?.lines?.length || Object.values(draft.consulting?.costs || {}).some((value) => num(value) !== 0) ||
      Object.values(draft.costs || {}).some((value) => num(value) !== 0) || hasConditionMemory || hasWorkflowSelection
    );
  }

  function activeMaster() {
    return masters.find((master) => master.id === estimate.masterId) || masters[0];
  }

  function editorMaster() {
    return masters.find((master) => master.id === editorMasterId) || activeMaster();
  }

  function persistMasters() {
    const stored = masters.filter((master) => !master.bundled && (master.catalogManaged || master.scopeStatus !== "national-standard-reference"));
    localStorage.setItem(MASTER_KEY, JSON.stringify(stored));
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
    document.dispatchEvent(new CustomEvent("ezsekisan:draftrestored"));
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
        .filter((line) => line.masterItem && !line.inputPending && Number(line.quantity) > 0)
    });
    return window.SekisanEngine.calculateEstimate(prepared, master);
  }

  function populateMasterSelects() {
    const active = activeMaster();
    estimate.submissionJurisdictionCode = normalizeSubmissionJurisdictionCode(estimate.submissionJurisdictionCode);
    $("jurisdictionSelect").innerHTML = `<option value="">提出先を選択しない</option>` + submissionJurisdictions().map((region) => `<option value="${region.code}">${h(region.name)}</option>`).join("");
    $("jurisdictionSelect").value = estimate.submissionJurisdictionCode;
    const selectableMasters = masters.slice().sort((a, b) => num(b.fiscalYear) - num(a.fiscalYear) || String(a.label).localeCompare(String(b.label), "ja"));
    $("fiscalYearSelect").innerHTML = selectableMasters.map((master) => `<option value="${h(master.id)}">${h(eraLabel(master.fiscalYear))}｜${h(master.jurisdictionCode === "mlit" ? "国土交通省・全国標準" : master.label)}</option>`).join("");
    $("fiscalYearSelect").value = active.id;
    const editorMasters = masters;
    if (!editorMasters.some((master) => master.id === editorMasterId)) editorMasterId = active.id;
    const options = editorMasters.map((master) => `<option value="${h(master.id)}">${h(master.jurisdictionName)}｜${h(eraLabel(master.fiscalYear))}｜${h(master.label)}${master.bundled ? "（初期収録）" : ""}</option>`).join("");
    $("masterEditorSelect").innerHTML = options;
    $("masterEditorSelect").value = editorMasterId;
    $("masterJurisdiction").innerHTML = (window.SEKISAN_JURISDICTIONS || []).map((region) => `<option value="${region.code}">${h(region.name)}</option>`).join("");
    const standardYears = [...new Set(masters.filter((master) => master.jurisdictionCode === "mlit" && master.verificationStatus === "standard-reference").map((master) => master.fiscalYear))].sort();
    $("masterCoverageStatus").textContent = `国土交通省・全国標準の令和${standardYears.map((year) => year - 2018).join("・")}年度を収録。見積提出先は「選択しない」または「国土交通省（全国標準）」だけです。`;
  }

  function populateCategories() {
    const master = activeMaster();
    const scopedItems = surveyItemsForScope(master);
    renderSurveyKeywords(scopedItems);
    const keywordItems = surveyItemsForKeyword(scopedItems);
    const categories = [...new Set(keywordItems.map((item) => item.category))];
    const savedCategory = workflowState().survey.category;
    const previous = $("categorySelect").value || savedCategory;
    $("categorySelect").innerHTML = (categories.length > 1 ? `<option value="">すべての作業区分</option>` : "") + categories.map((category) => `<option>${h(category)}</option>`).join("");
    $("categorySelect").value = categories.includes(previous) ? previous : (categories.length === 1 ? categories[0] : "");
    workflowState().survey.category = $("categorySelect").value;
    populateItems();
    renderSurveyScopeLabels();
  }

  function populateItems() {
    const master = activeMaster();
    const category = $("categorySelect").value;
    const query = String($("surveyItemSearch").value || "").trim().toLocaleLowerCase("ja");
    const previous = $("itemSelect").value;
    const filtered = surveyItemsForKeyword(surveyItemsForScope(master)).filter((item) =>
      (!category || item.category === category)
      && (!query || `${item.code} ${item.name} ${item.category}`.toLocaleLowerCase("ja").includes(query))
    );
    $("itemSelect").innerHTML = filtered.map((item) => `<option value="${h(item.code)}">${h(item.code)}｜${h(item.name)}</option>`).join("");
    if (filtered.some((item) => item.code === previous)) $("itemSelect").value = previous;
    updateSelectedItemMeta();
  }

  function updateSelectedItemMeta() {
    const item = activeMaster().workItems.find((entry) => entry.code === $("itemSelect").value);
    if (!item) {
      selectedSurveyQuantityKey = "";
      $("newItemQuantityLabel").textContent = "積算数量";
      $("newItemQuantity").value = "";
      $("selectedItemMeta").innerHTML = "<strong>適用できる測量歩掛がありません。</strong>";
      $("surveyConditionFields").innerHTML = "";
      updateSurveyAddState(null);
      renderSelectedSurveySources(null);
      return;
    }
    $("newItemQuantityLabel").textContent = `積算数量（${item.unit}）`;
    const quantityKey = `${activeMaster().id}:${item.code}`;
    if (selectedSurveyQuantityKey !== quantityKey) $("newItemQuantity").value = "";
    selectedSurveyQuantityKey = quantityKey;
    applyQuantityInputRule($("newItemQuantity"), item);
    const qRule = quantityRule(item);
    const standard = window.SekisanEngine.calculateItem({ masterItem: item, quantity: item.standardQuantity, correctionRate: 0, conditionValue: item.conditionFormula?.default }, activeMaster(), {});
    $("selectedItemMeta").innerHTML = `<strong>${h(item.name)}</strong><span>標準単位：${numberFormat.format(item.standardQuantity)} ${h(item.unit)}／数量入力：${h(quantityLabel(qRule))}</span><small>${h(regulationPathForItem(item))}</small><small>標準直接費 ${yen.format(standard.standardDirect)} ÷ ${numberFormat.format(item.standardQuantity)} ${h(item.unit)} → 1${h(item.unit)}当り ${yen.format(standard.standardUnitPrice)}</small>`;
    renderSurveyConditionFields(item);
    updateSurveyAddState(item);
    renderSelectedSurveySources(item);
  }

  function renderSurveyConditionFields(item) {
    const applicability = item.applicability
      ? `<details class="consulting-applicability"><summary>適用範囲</summary><ol><li>${h(item.applicability.note)}</li></ol></details>`
      : "";
    const conditionInput = item.conditionFormula
      ? `<label class="field"><span>${h(item.conditionFormula.label)}（${h(item.conditionFormula.unit)}）</span><input id="surveyConditionValue" type="number" min="0" step="0.1" inputmode="decimal" value="${h(item.conditionFormula.default)}"><small>${h(item.conditionFormula.note || "入力値から規定の補正係数を自動計算します。")}</small></label>`
      : "";
    const correctionInputs = (item.correctionRules || []).map((rule) => `<label class="field"><span>${h(rule.label)}</span><select class="survey-rule-condition" data-rule="${h(rule.id)}"><option value="">選択してください</option>${(rule.options || []).map((option) => `<option value="${h(option.rate)}" data-condition-label="${h(option.label)}">${h(option.label)}（${option.rate >= 0 ? "+" : ""}${h(enginePercent(option.rate))}%）</option>`).join("")}</select></label>`).join("");
    const formulas = [];
    if (item.conditionFormula) formulas.push(`${item.conditionFormula.label}：補正係数＝${item.conditionFormula.a}×入力値${item.conditionFormula.b >= 0 ? "+" : ""}${item.conditionFormula.b}`);
    if (item.quantityFormula?.note) formulas.push(item.quantityFormula.note);
    const formulaDetails = formulas.length ? `<details class="consulting-formula-list"><summary>基準書の補正式・数量式</summary><ol>${formulas.map((formula) => `<li>${h(formula)}</li>`).join("")}</ol></details>` : "";
    const manualNote = item.manualCostNote ? `<p class="consulting-incomplete-rule">要確認：${h(item.manualCostNote)}</p>` : "";
    const noConditions = !applicability && !conditionInput && !correctionInputs && !formulaDetails
      ? "<p>この作業項目に選択が必要な適用条件・補正はありません。</p>"
      : "";
    $("surveyConditionFields").innerHTML = `<fieldset><legend>測量積算基準の適用範囲・条件表・補正</legend>${conditionInput}${correctionInputs}${applicability}${formulaDetails}${manualNote}${noConditions}</fieldset>`;
    applySurveyConditionMemory(item);
  }

  function normalizedConditionLabel(label) {
    return String(label || "").replace(/^標準[：・]?\s*/, "").replace(/（標準）/g, "").trim();
  }

  function surveyConditionValueMemoryKey(item) {
    if (!item?.conditionFormula) return "";
    return `condition-value:${normalizedConditionLabel(item.conditionFormula.label)}:${String(item.conditionFormula.unit || "").trim()}`;
  }

  function applySurveyConditionMemory(item) {
    const memory = conditionMemory("survey").values;
    for (const rule of item.correctionRules || []) {
      const saved = memory[rule.id];
      if (!saved?.label) continue;
      const select = $("surveyConditionFields").querySelector(`.survey-rule-condition[data-rule="${CSS.escape(rule.id)}"]`);
      const option = [...(select?.options || [])].find((candidate) => candidate.dataset.conditionLabel
        && normalizedConditionLabel(candidate.dataset.conditionLabel) === normalizedConditionLabel(saved.label));
      if (option) select.selectedIndex = option.index;
    }
    const valueKey = surveyConditionValueMemoryKey(item);
    const valueInput = $("surveyConditionFields").querySelector("#surveyConditionValue");
    if (valueKey && valueInput && Object.prototype.hasOwnProperty.call(memory, valueKey)) valueInput.value = String(memory[valueKey]);
  }

  function rememberSurveyConditionSelections(item = activeMaster().workItems.find((entry) => entry.code === $("itemSelect").value)) {
    const memory = conditionMemory("survey").values;
    $("surveyConditionFields").querySelectorAll(".survey-rule-condition").forEach((select) => {
      const selected = select.selectedOptions[0];
      if (!select.value || !selected?.dataset.conditionLabel) delete memory[select.dataset.rule];
      else memory[select.dataset.rule] = { label: selected.dataset.conditionLabel, rate: num(select.value) };
    });
    const valueKey = surveyConditionValueMemoryKey(item);
    const valueInput = $("surveyConditionFields").querySelector("#surveyConditionValue");
    if (valueKey && valueInput) {
      if (String(valueInput.value || "").trim() === "") delete memory[valueKey];
      else memory[valueKey] = Math.max(0, num(valueInput.value));
    }
    scheduleSave();
  }

  function enginePercent(rate) {
    return Number((num(rate) * 100).toFixed(3));
  }

  function surveyPresetValidation(item = activeMaster().workItems.find((entry) => entry.code === $("itemSelect").value)) {
    if (!item) return { valid: false, reason: "作業項目を選択してください。", focusSelector: "#itemSelect" };
    if (String($("newItemQuantity").value || "").trim() === "") return { valid: false, reason: "積算数量を入力してください。", focusSelector: "#newItemQuantity" };
    const quantity = window.SekisanEngine.normalizeQuantity($("newItemQuantity").value, item, activeMaster());
    if (!(quantity > 0)) return { valid: false, reason: "積算数量は0より大きい値を入力してください。", focusSelector: "#newItemQuantity" };
    if (item.applicability?.minimum != null && quantity < Number(item.applicability.minimum)) return { valid: false, reason: `適用範囲は${item.applicability.note}です。`, focusSelector: "#newItemQuantity" };
    if (item.applicability?.maximum != null && quantity > Number(item.applicability.maximum)) return { valid: false, reason: `適用範囲は${item.applicability.note}です。`, focusSelector: "#newItemQuantity" };
    const correctionSelections = {};
    const correctionSelectionLabels = {};
    for (const rule of item.correctionRules || []) {
      const select = $("surveyConditionFields").querySelector(`.survey-rule-condition[data-rule="${CSS.escape(rule.id)}"]`);
      if (!select || select.value === "") return { valid: false, reason: `条件表「${rule.label}」を選択してください。`, focusSelector: `.survey-rule-condition[data-rule="${CSS.escape(rule.id)}"]` };
      const selected = select.selectedOptions[0];
      correctionSelections[rule.id] = num(select.value);
      correctionSelectionLabels[rule.id] = selected?.dataset.conditionLabel || selected?.textContent?.trim() || "";
    }
    const conditionInput = $("surveyConditionFields").querySelector("#surveyConditionValue");
    const conditionValue = conditionInput ? Number(conditionInput.value) : item.conditionFormula?.default;
    if (conditionInput && (!Number.isFinite(conditionValue) || conditionValue < 0)) return { valid: false, reason: `${item.conditionFormula.label}を入力してください。`, focusSelector: "#surveyConditionValue" };
    return { valid: true, reason: "必要な数量・条件が入力済みです。追加できます。", quantity, correctionSelections, correctionSelectionLabels, conditionValue };
  }

  function setAddButtonValidationState(button, validation) {
    button.disabled = false;
    button.dataset.inputValid = validation.valid ? "true" : "false";
    button.classList.toggle("needs-input", !validation.valid);
    button.title = validation.valid ? "この作業項目を追加" : `クリックして未入力を確認：${validation.reason}`;
  }

  function showMissingInputPopup(validation) {
    alert(`追加できません。\n\n${validation?.reason || "未入力の項目を確認してください。"}`);
    const target = validation?.focusSelector ? document.querySelector(validation.focusSelector) : null;
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
      target.classList.remove("missing-input-focus");
      void target.offsetWidth;
      target.classList.add("missing-input-focus");
      setTimeout(() => target.classList.remove("missing-input-focus"), 2400);
    });
  }

  function updateSurveyAddState(item) {
    const validation = surveyPresetValidation(item || undefined);
    setAddButtonValidationState($("addItemButton"), validation);
    $("surveyPresetStatus").textContent = validation.reason;
    return validation;
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
    const savedLabel = normalizedConditionLabel(line.correctionSelectionLabels?.[rule.id]);
    const exactIndex = savedLabel ? rule.options.findIndex((option) => normalizedConditionLabel(option.label) === savedLabel) : -1;
    const selectedIndex = exactIndex >= 0 ? exactIndex : Math.max(0, rule.options.findIndex((option) => option.rate === current));
    const choices = rule.options.map((option, index) => `<option value="${index}" data-rate="${h(option.rate)}" data-condition-label="${h(option.label)}" ${index === selectedIndex ? "selected" : ""}>${h(option.label)}（${option.rate >= 0 ? "+" : ""}${(option.rate * 100).toFixed(0)}%）</option>`).join("");
    return `<label class="mini-field">${h(rule.label)} <select class="line-rule" data-rule="${h(rule.id)}">${choices}</select></label>`;
  }

  function renderLines(result) {
    const master = activeMaster();
    const visibleLines = result.lines;
    const pendingHtml = estimate.lines.filter((line) => line.inputPending).map((line) => {
      const item = master.workItems.find((entry) => entry.code === line.code);
      if (!item) return "";
      const qRule = quantityRule(item, master);
      const itemEditorOptions = surveyItemsForScope(master).map((candidate) => `<option value="${h(candidate.code)}" ${candidate.code === line.code ? "selected" : ""}>${h(candidate.code)}｜${h(candidate.name)}</option>`).join("");
      const importSource = line.importSource ? `<small>資料取込：${h(line.importSource.fileName || "PDF")} p.${h(line.importSource.page || 1)}／${line.importSource.method === "ocr" ? "OCR" : "文字抽出"}／要原文照合</small>` : "";
      return `<tr data-line-id="${h(line.id)}" class="pending-input-row ${recentlyImportedSurveyLineIds.has(line.id) ? "recently-imported-line" : ""}">
        <td><select class="line-code table-item-select" aria-label="作業項目を変更">${itemEditorOptions}</select><span class="item-code">クリックして作業項目を変更</span>${importSource}<span class="pending-input-label">数量未入力（計算対象外）</span></td>
        <td><input class="table-input line-quantity" type="number" min="${qRule.min}" step="${qRule.step}" inputmode="${qRule.integer ? "numeric" : "decimal"}" data-quantity-decimals="${qRule.decimals}" aria-description="${h(item.unit)}は${h(quantityLabel(qRule))}" value="" placeholder="未入力"><span> ${h(item.unit)}</span><small>${h(quantityLabel(qRule))}</small></td>
        <td><small>数量を入力すると計算を開始します。</small></td><td>—</td><td>—</td><td>—</td>
        <td class="no-print"><button class="delete-line" type="button" title="削除" aria-label="${h(item.name)}を削除">×</button></td>
      </tr>`;
    }).join("");
    const calculatedHtml = visibleLines.map((calculated) => {
      const line = estimate.lines.find((entry) => entry.id === calculated.id);
      const item = master.workItems.find((entry) => entry.code === calculated.code);
      const qRule = quantityRule(item, master);
      const itemEditorOptions = surveyItemsForScope(master).map((candidate) => `<option value="${h(candidate.code)}" ${candidate.code === line.code ? "selected" : ""}>${h(candidate.code)}｜${h(candidate.name)}</option>`).join("");
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
        <p class="calc-source">${(() => { const source = (master.sourceLinks || []).find((entry) => typeof entry === "object" && String(entry.label || "").includes("第1編 測量業務")) || (master.sourceLinks || [])[0]; const label = source?.label || "国土交通省 標準積算基準書 第1編 測量業務"; const pageText = item.source?.standardPage ? `p.${h(item.source.standardPage)}${item.source.ratioPage ? `／直接経費率 p.${h(item.source.ratioPage)}` : ""}` : "現行全編の項目別ページ未対応"; return source?.url && /^https:\/\//i.test(source.url) ? `出典：<a href="${h(source.url)}" target="_blank" rel="noopener noreferrer">${h(label)}</a> ${pageText}` : `出典：${h(label)} ${pageText}`; })()}</p>
      </div></details>`;
      const importSource = line.importSource ? `<small>資料取込：${h(line.importSource.fileName || "貼付け原文")} p.${h(line.importSource.page || 1)}／${line.importSource.method === "ocr" ? "OCR" : "文字抽出"}／要原文照合</small>` : "";
      return `<tr data-line-id="${h(line.id)}" class="${recentlyImportedSurveyLineIds.has(line.id) ? "recently-imported-line" : ""}">
        <td><select class="line-code table-item-select" aria-label="作業項目を変更">${itemEditorOptions}</select><span class="item-code">クリックして作業項目を変更 ｜ 標準歩掛 ${numberFormat.format(item.standardQuantity)} ${h(item.unit)} 一式＝${yen.format(calculated.standardDirect)}</span>${importSource}${precisionInput}${outside ? `<span class="limit-warning">適用範囲外：${h(item.applicability.note)}</span>` : ""}${item.manualCostNote ? `<span class="limit-warning">${h(item.manualCostNote)}</span>` : ""}${auditDetail}</td>
        <td><input class="table-input line-quantity" type="number" min="${qRule.min}" step="${qRule.step}" inputmode="${qRule.integer ? "numeric" : "decimal"}" data-quantity-decimals="${qRule.decimals}" aria-description="${h(item.unit)}は${h(quantityLabel(qRule))}" value="${h(calculated.quantity)}"><span> ${h(item.unit)}</span><small>${h(quantityLabel(qRule))}</small></td>
        <td>${conditionInput}${rulesInput}<label class="mini-field">手動追加 <span class="percent-wrap"><input class="table-input line-correction" type="number" step=".1" value="${h(num(line.correctionRate) * 100)}"><span>%</span></span></label><small>規定変化率 ${(calculated.ruleCorrectionRate * 100).toFixed(1)}%／適用係数 ${calculated.correctionFactor.toFixed(2)}</small>${item.quantityFormula ? `<small>${h(item.quantityFormula.note)}／数量係数 ${calculated.quantityFactor.toFixed(2)}</small>` : ""}</td>
        <td>${priceCell}</td>
        <td><strong>${yen.format(calculated.directWork)}</strong><small>${directFormula}</small></td>
        <td>${yen.format(calculated.precision)}</td>
        <td class="no-print"><button class="delete-line" type="button" title="削除" aria-label="${h(calculated.name)}を削除">×</button></td>
      </tr>`;
    }).join("");
    $("lineTableBody").innerHTML = pendingHtml + calculatedHtml;
    $("emptyState").classList.toggle("hidden", estimate.lines.length > 0);
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
    if (master.verificationStatus === "standard-reference") issues.push({ severity: "warn", text: "全国標準単価セットです。地域条件、普通作業員単価、材料・市場・機械単価、補正、適用通知を発注図書で確認してください。" });
    else if (master.verificationStatus === "official-reference") issues.push({ severity: "warn", text: "国土交通省の公開基準参照版です。地方整備局等の適用通知・特記仕様・正解積算と照合してください。" });
    else if (master.verificationStatus !== "verified") issues.push({ severity: "warn", text: "利用者作成マスターです。発注機関・年度・出典と正解積算を照合してください。" });
    if (!estimate.lines.length) issues.push({ severity: "info", text: "作業項目がまだありません。" });
    estimate.lines.filter((line) => line.inputPending).forEach((line) => {
      const item = master.workItems.find((entry) => entry.code === line.code);
      issues.push({ severity: "error", text: `${item?.name || line.code}：数量未入力のため計算対象外です。` });
    });
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
    $("validationTitle").textContent = hasError ? "未確定項目があります" : hasWarning ? "確認が必要です" : estimate.lines.length ? "自動計算範囲は入力済み" : "提出前チェック";
    const visible = issues.slice(0, 5);
    $("validationList").innerHTML = visible.length
      ? visible.map((issue) => `<li>${h(issue.text)}</li>`).join("") + (issues.length > visible.length ? `<li>ほか${issues.length - visible.length}件</li>` : "")
      : "<li>案件の特記仕様書・成果検定費・旅費条件を最終照合してください。</li>";
  }

  function renderEstimate() {
    $("projectName").value = estimate.projectName || "";
    $("estimateDate").value = estimate.date || "";
    $("projectMemo").value = estimate.memo || "";
    const projectInfo = estimate.projectInfo || (estimate.projectInfo = defaultProjectInfo());
    document.querySelectorAll(".project-info-input").forEach((input) => { input.value = projectInfo[input.dataset.projectInfo] || ""; });
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

  function projectInfoRows(includeEstimateDate = false) {
    const info = estimate.projectInfo || {};
    const rows = [
      ["業務名", estimate.projectName], ["発注者", info.orderingParty], ["担当部署", info.department],
      ["担当者", info.contactName], ["業務場所", info.workLocation], ["履行期間", info.contractPeriod],
      ["文書・業務番号", info.documentNumber], ["公告・資料日", info.documentDate]
    ];
    if (includeEstimateDate) rows.push(["積算日", displayDate(estimate.date)]);
    return rows.filter(([, value]) => String(value || "").trim()).map(([label, value]) => `<div><dt>${h(label)}</dt><dd>${h(value)}</dd></div>`).join("") || "<div><dt>業務名</dt><dd>—</dd></div>";
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
      <dl class="report-project-meta">${projectInfoRows(true)}</dl>
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
      <dl class="report-project-meta">${projectInfoRows(false)}</dl>
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
      ["見積提出先", estimate.submissionJurisdictionCode ? jurisdictionName(estimate.submissionJurisdictionCode) : "未設定"],
      ["使用マスター", master.label], ["検証状態", verificationLabel(master)], ["歩掛年度", eraLabel(master.walkYear || master.fiscalYear)], ["技術者単価年度", eraLabel(master.rateYear || master.fiscalYear)],
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
      <section class="report-note-block source-note"><h2>公式PDF・計算根拠一覧</h2><p>資料の取得状態と、実際の計算への使用状況を分けて記載しています。</p><table class="report-table source-report-table"><thead><tr><th>PDF・資料名</th><th>計算での用途</th><th>頁数</th><th>確認状態</th></tr></thead><tbody>${sourceTableHtml(master)}</tbody></table></section>
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
    $("printDocument").dataset.mode = "survey";
    $("printDocument").innerHTML = pages.join("") || `<section class="report-page">${reportHeader("帳票未選択")}<p class="empty-report-message">帳票・PDF画面で、出力する帳票を1つ以上選択してください。</p></section>`;
  }

  function updateReportSettings() {
    estimate.report = estimate.report || defaultReportSettings(estimate.date);
    document.querySelectorAll(".report-input").forEach((input) => { estimate.report[input.dataset.report] = input.value; });
    document.querySelectorAll(".report-section-input").forEach((input) => { estimate.report.sections[input.dataset.section] = input.checked; });
    persistIssuerProfile(estimate.report);
    renderReportCompleteness();
    scheduleSave();
  }

  function clearIssuerProfile() {
    localStorage.removeItem(ISSUER_PROFILE_KEY);
    estimate.report = { ...estimate.report, ...emptyIssuerProfile() };
    document.querySelectorAll(".report-input").forEach((input) => {
      if (issuerProfileFields.includes(input.dataset.report)) input.value = "";
    });
    renderReportCompleteness();
    scheduleSave();
    showToast("この端末に保存した自社・発行者情報を消去しました");
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
    $("masterJurisdiction").value = master.jurisdictionCode;
    $("masterYear").value = master.fiscalYear;
    $("masterLabel").value = master.label;
    $("masterEffective").value = master.effectiveFrom || "";
    $("rolePriceGrid").innerHTML = Object.entries(master.roles).map(([key, role]) => `<div class="role-price-row"><label for="role-${h(key)}">${h(role.name)}</label><div class="price-input-wrap"><input id="role-${h(key)}" class="role-price-input" data-role="${h(key)}" type="number" min="0" step="100" value="${h(role.price)}"><span>円</span></div></div>`).join("");
    $("masterItemCount").textContent = master.workItems.length;
    $("masterRateYear").textContent = `R${num(master.rateYear, master.fiscalYear) - 2018}`;
    $("masterWalkYear").textContent = `R${num(master.walkYear, master.fiscalYear) - 2018}`;
    $("sourceList").innerHTML = sourceListHtml(master);
  }

  function renderAll() {
    const workflow = workflowState();
    activeSurveyKeyword = workflow.survey.keyword || "all";
    $("surveyItemSearch").value = workflow.survey.search || "";
    populateMasterSelects();
    populateCategories();
    renderEstimate();
    renderMasterEditor();
    renderReportSettings();
    renderGuideSourceLedger(false);
    document.dispatchEvent(new CustomEvent("ezsekisan:estimatechange"));
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
    const validation = updateSurveyAddState(item);
    if (!validation.valid) { showMissingInputPopup(validation); return; }
    estimate.lines.push({ id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`, code, quantity: validation.quantity, correctionRate: 0, correctionSelections: validation.correctionSelections, correctionSelectionLabels: validation.correctionSelectionLabels, conditionValue: validation.conditionValue, precisionRate: item.precisionRate, manualUnitPrice: 0 });
    $("newItemQuantity").value = "";
    updateSelectedItemMeta();
    recalculate();
    showToast("作業項目を追加しました");
  }

  function importSurveyLines(entries, metadata = {}) {
    const master = activeMaster();
    let added = 0;
    let rejected = 0;
    (Array.isArray(entries) ? entries : []).forEach((entry) => {
      const item = master.workItems.find((candidate) => candidate.code === entry.code);
      if (!item) { rejected += 1; return; }
      const requestedPending = entry.inputPending === true || entry.quantity == null || String(entry.quantity).trim() === "";
      const quantity = requestedPending ? null : window.SekisanEngine.normalizeQuantity(entry.quantity, item, master);
      if (!requestedPending && !(quantity > 0)) { rejected += 1; return; }
      const id = `line-import-${Date.now()}-${added}-${Math.random().toString(16).slice(2)}`;
      recentlyImportedSurveyLineIds.add(id);
      estimate.lines.push({
        id,
        code: item.code,
        quantity,
        inputPending: requestedPending,
        correctionRate: 0,
        correctionSelections: {},
        correctionSelectionLabels: {},
        conditionValue: item.conditionFormula?.default,
        precisionRate: item.precisionRate,
        manualUnitPrice: 0,
        importSource: {
          fileName: String(entry.fileName || metadata.fileName || "").slice(0, 180),
          page: Math.max(1, Math.floor(num(entry.page, 1))),
          method: entry.method === "ocr" ? "ocr" : "text",
          confidence: ["high", "medium", "low"].includes(entry.confidence) ? entry.confidence : "low"
        }
      });
      added += 1;
    });
    renderAll();
    scheduleSave();
    if (recentlyImportedSurveyLineIds.size) setTimeout(() => {
      recentlyImportedSurveyLineIds.forEach((id) => document.querySelector(`[data-line-id="${CSS.escape(id)}"]`)?.classList.remove("recently-imported-line"));
      recentlyImportedSurveyLineIds.clear();
    }, 4500);
    return { added, rejected };
  }

  function preferredMaster(_jurisdictionCode, fiscalYear) {
    const priority = (master) => master.verificationStatus === "verified" ? 30 : master.verificationStatus === "user-supplied" ? 20 : 10;
    return masters.filter((master) => master.jurisdictionCode === "mlit" && (!fiscalYear || master.fiscalYear === fiscalYear))
      .sort((a, b) => priority(b) - priority(a) || num(b.fiscalYear) - num(a.fiscalYear))[0] || null;
  }

  function addCaseSources(entries = []) {
    estimate.caseFile = estimate.caseFile || defaultCaseFile();
    estimate.caseFile.sources = Array.isArray(estimate.caseFile.sources) ? estimate.caseFile.sources : [];
    let added = 0;
    let duplicate = 0;
    entries.forEach((entry) => {
      const url = String(entry.url || "").trim().slice(0, 1000);
      const sha256 = String(entry.sha256 || "").trim().toUpperCase().slice(0, 64);
      if (!url && !sha256) return;
      if (estimate.caseFile.sources.some((source) => (url && source.url === url) || (sha256 && source.sha256 === sha256))) { duplicate += 1; return; }
      estimate.caseFile.sources.push({
        id: `source-${Date.now()}-${added}-${Math.random().toString(16).slice(2)}`,
        title: String(entry.title || "公式資料").trim().slice(0, 180) || "公式資料",
        url,
        documentType: ["notice", "instructions", "specification", "quantity", "designDocument", "qa", "correction", "other", "local"].includes(entry.documentType) ? entry.documentType : "other",
        organization: String(entry.organization || "").trim().slice(0, 120),
        publishedDate: String(entry.publishedDate || "").trim().slice(0, 10),
        acquiredAt: new Date().toISOString(),
        discoveredVia: String(entry.discoveredVia || "手動登録").trim().slice(0, 80),
        portalKey: String(entry.portalKey || "").trim().slice(0, 240),
        matchScore: Math.max(0, Math.min(100, Math.floor(num(entry.matchScore)))),
        sha256,
        status: ["adopted", "review", "rejected"].includes(entry.status) ? entry.status : "review",
        note: String(entry.note || "").trim().slice(0, 240)
      });
      added += 1;
    });
    if (added) { renderAll(); scheduleSave(); }
    return { added, duplicate };
  }

  function updateCaseSource(id, patch = {}) {
    const source = estimate.caseFile?.sources?.find((entry) => entry.id === id);
    if (!source) return false;
    if (["adopted", "review", "rejected"].includes(patch.status)) source.status = patch.status;
    if (["notice", "instructions", "specification", "quantity", "designDocument", "qa", "correction", "other", "local"].includes(patch.documentType)) source.documentType = patch.documentType;
    if (patch.note != null) source.note = String(patch.note).trim().slice(0, 240);
    scheduleSave();
    document.dispatchEvent(new CustomEvent("ezsekisan:casefilechange"));
    return true;
  }

  function removeCaseSource(id) {
    if (!estimate.caseFile?.sources) return false;
    const before = estimate.caseFile.sources.length;
    estimate.caseFile.sources = estimate.caseFile.sources.filter((entry) => entry.id !== id);
    if (estimate.caseFile.sources.length === before) return false;
    scheduleSave();
    document.dispatchEvent(new CustomEvent("ezsekisan:casefilechange"));
    return true;
  }

  function updateEstimateField() {
    estimate.projectName = $("projectName").value;
    estimate.date = $("estimateDate").value;
    estimate.memo = $("projectMemo").value;
    if (!estimate.report.issueDate) estimate.report.issueDate = estimate.date;
    renderReportCompleteness();
    scheduleSave();
  }

  function applyImportedProjectNameIfEmpty(projectName) {
    const value = String(projectName || "").replace(/\s+/g, " ").trim().slice(0, 180);
    if (!value.endsWith("業務") || estimate.projectName?.trim()) return false;
    estimate.projectName = value;
    $("projectName").value = value;
    const consultingProjectName = $("consultingProjectName");
    if (consultingProjectName) consultingProjectName.value = value;
    renderReportCompleteness();
    scheduleSave();
    document.dispatchEvent(new CustomEvent("ezsekisan:estimatechange"));
    return true;
  }

  function updateProjectInfo(event) {
    const input = event.target;
    estimate.projectInfo = estimate.projectInfo || defaultProjectInfo();
    estimate.projectInfo[input.dataset.projectInfo] = input.value;
    document.querySelectorAll(`.project-info-input[data-project-info="${input.dataset.projectInfo}"]`).forEach((peer) => {
      if (peer !== input) peer.value = input.value;
    });
    if (input.dataset.projectInfo === "orderingParty") estimate.report.clientName = input.value;
    if (input.dataset.projectInfo === "contractPeriod") estimate.report.delivery = input.value;
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

  function switchMaster(id, options = {}) {
    const next = masters.find((master) => master.id === id);
    if (!next) return false;
    estimate.masterId = id;
    estimate.options.taxRate = next.taxRate;
    estimate.lines = estimate.lines.filter((line) => next.workItems.some((item) => item.code === line.code)).map((line) => {
      const item = next.workItems.find((entry) => entry.code === line.code);
      const value = validatedQuantity(line.quantity, item, next);
      const validQuantity = value !== null;
      return {
        ...line,
        quantity: validQuantity ? value : null,
        inputPending: !validQuantity,
        correctionRate: 0,
        correctionSelections: {},
        correctionSelectionLabels: {},
        conditionValue: item?.conditionFormula?.default,
        precisionRate: item?.precisionRate,
        manualUnitPrice: 0
      };
    });
    if (options.syncConsulting !== false && estimate.consulting) estimate.consulting.fiscalYear = Number(next.fiscalYear);
    populateMasterSelects();
    populateCategories();
    renderEstimate();
    scheduleSave();
    document.dispatchEvent(new CustomEvent("ezsekisan:fiscalyearchange", { detail: { fiscalYear: Number(next.fiscalYear), masterId: next.id } }));
    showToast(`${next.label}に切り替えました`);
    return true;
  }

  function setUnifiedFiscalYear(year) {
    const next = preferredMaster("mlit", Number(year));
    if (!next) return false;
    return switchMaster(next.id);
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
        estimate.submissionJurisdictionCode = normalizeSubmissionJurisdictionCode(imported.submissionJurisdictionCode);
        estimate.costs = Object.assign(emptyEstimate().costs, imported.costs || {});
        estimate.options = Object.assign(emptyEstimate().options, imported.options || {});
        estimate.consulting = Object.assign(defaultConsultingState(), imported.consulting || {});
        estimate.consulting.lines = Array.isArray(imported.consulting?.lines) ? imported.consulting.lines : [];
        estimate.consulting.costs = Object.assign(defaultConsultingState().costs, imported.consulting?.costs || {});
        estimate.consulting.options = Object.assign(defaultConsultingState().options, imported.consulting?.options || {});
        estimate.conditionMemory = normalizedConditionMemory(imported.conditionMemory);
        estimate.workflowState = normalizedWorkflowState(imported.workflowState);
        estimate.report = Object.assign(defaultReportSettings(estimate.date), imported.report || {});
        estimate.report.sections = Object.assign(defaultReportSettings().sections, imported.report?.sections || {});
        if (estimate.masterId === "r8-tokushima-2026") estimate.masterId = "standard-r8-2026";
        if (!masters.some((master) => master.id === estimate.masterId)) estimate.masterId = defaultMasterId;
        const master = activeMaster();
        estimate.consulting.fiscalYear = Number(master.fiscalYear);
        let correctedQuantities = 0;
        estimate.lines = estimate.lines.map((line) => {
          const item = master.workItems.find((entry) => entry.code === line.code);
          if (!item) return line;
          if (line.inputPending || line.quantity == null || String(line.quantity).trim() === "") return { ...line, quantity: null, inputPending: true };
          const quantity = validatedQuantity(line.quantity, item, master);
          if (quantity === null) {
            correctedQuantities += 1;
            return { ...line, quantity: null, inputPending: true };
          }
          return { ...line, quantity, inputPending: false };
        });
        renderAll();
        persistEstimate();
        showToast(correctedQuantities ? `積算書を読込み、規則外の数量${correctedQuantities}件を未入力へ戻しました` : "積算書を読み込みました");
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
    master.jurisdictionCode = $("masterJurisdiction").value;
    master.jurisdictionName = jurisdictionName(master.jurisdictionCode);
    master.jurisdictionType = master.jurisdictionCode === "mlit" ? "national" : "prefecture";
    master.fiscalYear = Math.trunc(num($("masterYear").value, master.fiscalYear));
    master.label = $("masterLabel").value.trim() || `${master.fiscalYear}年度マスター`;
    master.effectiveFrom = $("masterEffective").value;
    master.bundled = false;
    master.verificationStatus = "user-supplied";
    master.scopeStatus = "user-custom";
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
    copy.verificationStatus = "user-supplied";
    masters.push(copy);
    editorMasterId = copy.id;
    if (estimate.masterId === source.id) estimate.masterId = copy.id;
    return copy;
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
        normalizeMasterMetadata(master, $("masterJurisdiction").value || activeMaster().jurisdictionCode);
        master.verificationStatus = "user-supplied";
        master.scopeStatus = "user-custom";
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

  async function sha256Hex(text) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function validatedCatalogPath(path) {
    if (!/^data\/[a-z0-9._/-]+$/i.test(path) || path.includes("..")) throw new Error("配信パスが不正です");
    const url = new URL(path, location.href);
    if (url.origin !== location.origin) throw new Error("外部配信先は使用できません");
    return url.href;
  }

  function validateCatalogMaster(master, entry) {
    if (!master?.roles || !Array.isArray(master.workItems) || !master.workItems.length) throw new Error("マスター形式が不正です");
    if (entry.jurisdictionCode !== "mlit" || entry.verificationStatus !== "standard-reference") throw new Error("全国標準以外のマスターは自動追加できません");
    if (master.verificationStatus !== "standard-reference") throw new Error("全国標準の検証状態が一致しません");
    if (String(master.jurisdictionCode) !== String(entry.jurisdictionCode) || num(master.fiscalYear) !== num(entry.fiscalYear)) throw new Error("地域または年度がカタログと一致しません");
  }

  async function checkForMasterUpdates({ silent = false } = {}) {
    const status = $("masterUpdateStatus");
    const button = $("checkMasterUpdatesButton");
    if (location.protocol === "file:") {
      status.textContent = "ローカルファイル版では自動更新できません。GitHub Pages公開版で起動すると検証済み年度マスターを確認します。";
      if (!silent) showToast("公開版で年度マスターを更新確認できます");
      return;
    }
    button.disabled = true;
    if (!silent) status.textContent = "検証済みマスターの配信カタログを確認しています…";
    try {
      const response = await fetch(validatedCatalogPath(masterCatalogPath), { cache: "no-store" });
      if (!response.ok) throw new Error(`カタログ取得失敗（${response.status}）`);
      const catalog = await response.json();
      if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.masters)) throw new Error("カタログ形式が不正です");
      let added = 0;
      for (const entry of catalog.masters) {
        if (entry.jurisdictionCode !== "mlit" || entry.verificationStatus !== "standard-reference") continue;
        const alreadyInstalled = masters.some((master) => (master.catalogEntryId || master.id) === entry.id && String(master.masterVersion || "") === String(entry.version));
        if (alreadyInstalled) continue;
        const masterResponse = await fetch(validatedCatalogPath(entry.path), { cache: "no-store" });
        if (!masterResponse.ok) throw new Error(`${entry.jurisdictionName} ${entry.fiscalYear}年度の取得に失敗しました`);
        const raw = await masterResponse.text();
        if ((await sha256Hex(raw)) !== String(entry.sha256).toLowerCase()) throw new Error(`${entry.jurisdictionName} ${entry.fiscalYear}年度の検証値が一致しません`);
        const master = JSON.parse(raw);
        validateCatalogMaster(master, entry);
        master.catalogEntryId = entry.id;
        master.id = masters.some((installed) => installed.id === entry.id) ? `${entry.id}@${entry.version}` : entry.id;
        master.masterVersion = entry.version;
        master.verificationStatus = "standard-reference";
        master.scopeStatus = "national-standard-reference";
        master.catalogManaged = true;
        master.bundled = false;
        normalizeMasterMetadata(master, entry.jurisdictionCode);
        masters.push(master);
        added += 1;
      }
      if (added) {
        persistMasters();
        populateMasterSelects();
        status.textContent = `${added}件の全国標準単価セットを追加しました。標準単価セットから選択できます。`;
        showToast(`検証済みマスターを${added}件追加しました`);
      } else {
        status.textContent = `更新確認済み（${catalog.updatedAt || "更新日不明"}）。利用可能な検証済みマスターは最新です。`;
        if (!silent) showToast("年度マスターは最新です");
      }
    } catch (error) {
      status.textContent = `更新確認に失敗しました：${error.message}。現在収録済みのマスターはそのまま使用できます。`;
      if (!silent) showToast("年度マスターを更新できませんでした");
    } finally {
      button.disabled = false;
    }
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

  function canUseDocumentImport() {
    return !window.matchMedia(MOBILE_IMPORT_QUERY).matches;
  }

  function activateViewButton(button) {
    if (!button || (button.dataset.view === "import" && !canUseDocumentImport())) return false;
    document.querySelectorAll(".view-tab").forEach((entry) => entry.classList.toggle("active", entry === button));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    $(`${button.dataset.view}View`).classList.add("active");
    const businessScope = button.dataset.businessScope || "";
    document.body.dataset.businessScope = businessScope;
    if (businessScope === "survey") {
      populateCategories();
      renderEstimate();
    }
    document.dispatchEvent(new CustomEvent("ezsekisan:businessscope", { detail: { scope: businessScope } }));
    if (button.dataset.view === "master") { editorMasterId = estimate.masterId; populateMasterSelects(); renderMasterEditor(); }
    if (button.dataset.view === "guide") renderGuideSourceLedger(true);
    if (button.dataset.view === "report") renderReportSettings();
    if (button.dataset.view === "consulting") document.dispatchEvent(new CustomEvent("ezsekisan:estimatechange"));
    return true;
  }

  function enforceMobileImportAvailability() {
    const importButton = document.querySelector('.view-tab[data-view="import"]');
    const unavailable = !canUseDocumentImport();
    importButton?.toggleAttribute("hidden", unavailable);
    if (importButton) {
      importButton.tabIndex = unavailable ? -1 : 0;
      if (unavailable) importButton.setAttribute("aria-hidden", "true");
      else importButton.removeAttribute("aria-hidden");
    }
    if (unavailable && $("importView").classList.contains("active")) {
      activateViewButton(document.querySelector('.view-tab[data-business-scope="design"]'));
    }
  }

  function bindEvents() {
    const openAboutTool = () => {
      const dialog = $("aboutToolDialog");
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    };
    ["aboutToolButton", "publisherInfoButton"].forEach((id) => $(id).addEventListener("click", openAboutTool));
    $("closeAboutToolButton").addEventListener("click", () => $("aboutToolDialog").close());
    $("aboutToolDialog").addEventListener("click", (event) => { if (event.target === $("aboutToolDialog")) $("aboutToolDialog").close(); });
    document.querySelectorAll(".view-tab").forEach((button) => button.addEventListener("click", () => activateViewButton(button)));
    const mobileImportMedia = window.matchMedia(MOBILE_IMPORT_QUERY);
    mobileImportMedia.addEventListener?.("change", enforceMobileImportAvailability);
    enforceMobileImportAvailability();
    $("guideSourceYear").addEventListener("change", () => renderGuideSourceLedger(false));
    $("surveyKeywordList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-survey-keyword]");
      if (!button) return;
      activeSurveyKeyword = button.dataset.surveyKeyword;
      workflowState().survey.keyword = activeSurveyKeyword;
      workflowState().survey.category = "";
      $("surveyItemSearch").value = "";
      workflowState().survey.search = "";
      populateCategories();
      scheduleSave();
    });
    $("categorySelect").addEventListener("change", () => { workflowState().survey.category = $("categorySelect").value; populateItems(); scheduleSave(); });
    $("surveyItemSearch").addEventListener("input", () => { workflowState().survey.search = $("surveyItemSearch").value; populateItems(); scheduleSave(); });
    $("itemSelect").addEventListener("change", updateSelectedItemMeta);
    $("newItemQuantity").addEventListener("keydown", blockInvalidQuantityKey);
    $("newItemQuantity").addEventListener("paste", blockInvalidQuantityPaste);
    $("newItemQuantity").addEventListener("input", (event) => { enforceQuantityPrecision(event.target, quantityInputItem(event.target), true); updateSurveyAddState(); });
    $("newItemQuantity").addEventListener("change", (event) => { normalizeQuantityInput(event.target, quantityInputItem(event.target), true); updateSurveyAddState(); });
    $("surveyConditionFields").addEventListener("input", (event) => {
      if (event.target.id === "surveyConditionValue") rememberSurveyConditionSelections();
      updateSurveyAddState();
    });
    $("surveyConditionFields").addEventListener("change", (event) => {
      if (event.target.classList.contains("survey-rule-condition") || event.target.id === "surveyConditionValue") rememberSurveyConditionSelections();
      updateSurveyAddState();
    });
    $("addItemButton").addEventListener("click", addItem);
    $("jurisdictionSelect").addEventListener("change", (event) => {
      estimate.submissionJurisdictionCode = event.target.value;
      scheduleSave();
      document.dispatchEvent(new CustomEvent("ezsekisan:estimatechange"));
      showToast(event.target.value ? `見積提出先を${jurisdictionName(event.target.value)}に設定しました（単価は全国標準のままです）` : "見積提出先を未設定にしました");
    });
    $("fiscalYearSelect").addEventListener("change", (event) => switchMaster(event.target.value));
    ["projectName", "estimateDate", "projectMemo"].forEach((id) => $(id).addEventListener("input", updateEstimateField));
    document.querySelectorAll(".project-info-input").forEach((input) => input.addEventListener("input", updateProjectInfo));
    document.querySelectorAll(".cost-input").forEach((input) => input.addEventListener("input", updateOptions));
    ["taxRate", "useElectronic", "useFourDigits", "adjustBusinessPrice", "travelMode", "safetyRate"].forEach((id) => $(id).addEventListener("change", updateOptions));
    $("lineTableBody").addEventListener("input", (event) => {
      const row = event.target.closest("tr");
      const line = estimate.lines.find((entry) => entry.id === row?.dataset.lineId);
      if (!line) return;
      if (event.target.classList.contains("line-quantity")) {
        const item = activeMaster().workItems.find((entry) => entry.code === line.code);
        if (event.target.value === "") {
          line.quantity = null;
          line.inputPending = true;
        } else {
          const quantity = enforceQuantityPrecision(event.target, item, true);
          if (quantity > 0) { line.quantity = quantity; line.inputPending = false; }
        }
      }
      if (event.target.classList.contains("line-correction")) line.correctionRate = num(event.target.value) / 100;
      if (event.target.classList.contains("line-condition")) {
        line.conditionValue = Math.max(0, num(event.target.value));
        const item = activeMaster().workItems.find((entry) => entry.code === line.code);
        const valueKey = surveyConditionValueMemoryKey(item);
        if (valueKey) conditionMemory("survey").values[valueKey] = line.conditionValue;
      }
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
      if (line && event.target.classList.contains("line-code")) {
        const item = activeMaster().workItems.find((entry) => entry.code === event.target.value);
        if (item) {
          line.code = item.code;
          line.quantity = null;
          line.inputPending = true;
          line.correctionRate = 0;
          line.correctionSelections = {};
          line.correctionSelectionLabels = {};
          line.conditionValue = item.conditionFormula?.default;
          line.precisionRate = item.precisionRate;
          line.manualUnitPrice = 0;
          showToast(`作業項目を「${item.name}」へ変更しました。積算数量を入力してください`);
        }
      }
      if (line && event.target.classList.contains("line-quantity")) {
        const item = activeMaster().workItems.find((entry) => entry.code === line.code);
        const quantity = normalizeQuantityInput(event.target, item, true);
        line.quantity = quantity;
        line.inputPending = !(quantity > 0);
      }
      if (line && event.target.classList.contains("line-precision")) line.precisionRate = num(event.target.value);
      if (line && event.target.classList.contains("line-rule")) {
        const selected = event.target.selectedOptions[0];
        const rate = num(selected?.dataset.rate);
        const label = selected?.dataset.conditionLabel || selected?.textContent?.trim() || "";
        line.correctionSelections = line.correctionSelections || {};
        line.correctionSelectionLabels = line.correctionSelectionLabels || {};
        line.correctionSelections[event.target.dataset.rule] = rate;
        line.correctionSelectionLabels[event.target.dataset.rule] = label;
        conditionMemory("survey").values[event.target.dataset.rule] = { label, rate };
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
      if ((estimate.lines.length || estimate.consulting?.lines?.length) && !confirm("現在の積算内容を消して新規作成しますか？")) return;
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
    $("clearIssuerProfileButton").addEventListener("click", clearIssuerProfile);
    $("selectClientSetButton").addEventListener("click", () => setReportSections(["quote", "summary", "breakdown"]));
    $("selectFullSetButton").addEventListener("click", () => setReportSections(["quote", "summary", "breakdown", "unitDetail", "conditions"]));
    $("previewPrintButton").addEventListener("click", printReport);
    $("masterEditorSelect").addEventListener("change", (event) => { editorMasterId = event.target.value; renderMasterEditor(); });
    $("applyMasterMetaButton").addEventListener("click", saveMasterMeta);
    $("saveRolePricesButton").addEventListener("click", saveRolePrices);
    $("checkMasterUpdatesButton").addEventListener("click", () => checkForMasterUpdates());
    $("exportMasterButton").addEventListener("click", exportMaster);
    $("importMasterButton").addEventListener("click", () => $("masterFileInput").click());
    $("masterFileInput").addEventListener("change", (event) => { if (event.target.files[0]) importMaster(event.target.files[0]); event.target.value = ""; });
    $("deleteMasterButton").addEventListener("click", deleteMaster);
    window.addEventListener("beforeunload", () => { if (sessionDirty) persistEstimate(); });
    window.addEventListener("beforeprint", () => { if ($("printDocument").dataset.mode !== "consulting") renderPrintDocument(); });
    window.addEventListener("afterprint", () => { delete $("printDocument").dataset.mode; document.title = defaultDocumentTitle; });
  }

  window.EzSekisanApp = {
    getEstimate: () => estimate,
    getSurveyResult: currentResult,
    getActiveSurveyMaster: activeMaster,
    setUnifiedFiscalYear,
    getSubmissionJurisdictionCode: () => estimate.submissionJurisdictionCode || "",
    getSubmissionJurisdictionName: () => estimate.submissionJurisdictionCode ? jurisdictionName(estimate.submissionJurisdictionCode) : "",
    getSurveyItemsForScope: (scope, master = activeMaster()) => surveyItemsForScope(master, scope),
    getSurveyKeywordDefinitions: () => clone(surveyKeywordDefinitions),
    getSurveyRegulationGroups: () => clone(surveyRegulationGroups),
    getSurveyRegulationGroup: (item) => clone(regulationGroupForItem(item)),
    getSurveyRegulationPath: regulationPathForItem,
    getConditionMemory: (scope) => conditionMemory(scope),
    getWorkflowState: workflowState,
    saveDraft: scheduleSave,
    notify: showToast,
    canUseDocumentImport,
    setAddButtonValidationState,
    showMissingInputPopup,
    applyImportedProjectNameIfEmpty,
    importSurveyLines,
    addCaseSources,
    updateCaseSource,
    removeCaseSource,
    safeName
  };

  bindEvents();
  renderAll();
  if (new URLSearchParams(location.search).get("__qa_report") === "survey") {
    const item = activeMaster().workItems.find((entry) => entry.code === "2-2-1-1");
    estimate.projectName = "匿名化・帳票QA測量業務";
    estimate.projectInfo = { ...defaultProjectInfo(), orderingParty: "匿名発注機関", department: "検査用部署", workLocation: "匿名化済み", contractPeriod: "令和8年度" };
    estimate.lines = item ? [{ id: "qa-survey-line", code: item.code, quantity: 10, correctionRate: 0, correctionSelections: {}, conditionValue: item.conditionFormula?.default, precisionRate: item.precisionRate, manualUnitPrice: 0 }] : [];
    estimate.report = { ...defaultReportSettings(estimate.date), ...emptyIssuerProfile(), clientName: "匿名発注機関 御中", companyName: "株式会社アイズ測量", quoteNumber: "QA-2026-001", delivery: "契約条件による", validity: "発行日から30日", paymentTerms: "契約条件による", remarks: "帳票レイアウト検査用の匿名化データです。", sections: { quote: true, summary: true, breakdown: true, unitDetail: true, conditions: true } };
    renderAll();
    renderPrintDocument();
  }
  renderDraftRecovery();
  checkForMasterUpdates({ silent: true });
})();
