(function () {
  "use strict";

  const app = window.EzSekisanApp;
  const engine = window.OfficialCaseEngine;
  if (!app || !engine) return;

  const $ = (id) => document.getElementById(id);
  const h = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const TYPE_LABELS = {
    notice: "公告・公示", instructions: "入札説明書", specification: "仕様書・特記仕様書",
    quantity: "数量表・数量総括表", designDocument: "金抜設計書・内訳書", qa: "質問回答書",
    correction: "訂正・差替え", other: "その他", local: "手元資料"
  };
  const STATUS_LABELS = { review: "要確認", adopted: "採用", rejected: "不採用" };
  let rankedCandidates = [];

  function currentCriteria() {
    return {
      projectName: $("caseSearchProjectName").value.trim(),
      organizationName: $("caseSearchOrganization").value.trim(),
      documentNumber: $("caseSearchDocumentNumber").value.trim(),
      fiscalYear: Number($("caseSearchFiscalYear").value) || null,
      prefectureCode: $("caseSearchPrefecture").value,
      location: app.getEstimate().projectInfo?.workLocation || ""
    };
  }

  function syncCriteriaFromEstimate() {
    const estimate = app.getEstimate();
    const master = app.getActiveSurveyMaster();
    $("caseSearchProjectName").value = estimate.projectName || "";
    $("caseSearchOrganization").value = estimate.projectInfo?.orderingParty || master.jurisdictionName || "";
    $("caseSearchDocumentNumber").value = estimate.projectInfo?.documentNumber || "";
    $("caseSearchFiscalYear").value = master.fiscalYear || "";
    $("caseSearchPrefecture").value = /^\d{2}$/.test(master.jurisdictionCode) ? master.jurisdictionCode : "";
    updateSearchLinks();
  }

  function updateSearchLinks() {
    const criteria = currentCriteria();
    $("openKkjPortalSearchLink").href = engine.buildKkjPortalUrl(criteria);
    $("openKkjApiSearchLink").href = engine.buildKkjApiUrl(criteria);
  }

  function sourceTypeOptions(selected) {
    return Object.entries(TYPE_LABELS).map(([value, label]) => `<option value="${h(value)}" ${value === selected ? "selected" : ""}>${h(label)}</option>`).join("");
  }

  function statusOptions(selected) {
    return Object.entries(STATUS_LABELS).map(([value, label]) => `<option value="${h(value)}" ${value === selected ? "selected" : ""}>${h(label)}</option>`).join("");
  }

  function candidateHtml(candidate, index) {
    const sources = engine.recordSources(candidate);
    const checks = sources.map((source, sourceIndex) => `<label class="check"><input class="case-candidate-source-select" type="checkbox" data-source-index="${sourceIndex}" checked><span><strong>${h(TYPE_LABELS[source.documentType] || "資料")}</strong> ${h(source.title)}<small>${h(source.url)}</small></span></label>`).join("");
    const date = String(candidate.issueDate || candidate.acquiredDate || "").slice(0, 10) || "日付不明";
    return `<article class="official-case-candidate" data-candidate-index="${index}" data-level="${h(candidate.match.level)}"><div class="case-match-score"><strong>${candidate.match.score}</strong><span>一致度</span></div><div class="case-candidate-main"><h3>${h(candidate.projectName || "案件名なし")}</h3><p>${h(candidate.organizationName || "機関名なし")}／${h(date)}／${h(candidate.procedureType || candidate.category || "区分不明")}</p><div class="case-reasons">${candidate.match.reasons.map((reason) => `<span>${h(reason)}</span>`).join("") || "<span>一致根拠が不足</span>"}</div><div class="candidate-source-checks">${checks || "<small>登録できるURLがありません。</small>"}</div></div><div class="case-candidate-meta"><p><strong>履行場所</strong><br>${h(candidate.location || candidate.prefectureName || "—")}</p><p><strong>検索収録</strong><br>添付${candidate.attachments.length}件／全体ヒットの一候補</p></div><button class="button register-case-candidate" type="button" ${sources.length ? "" : "disabled"}>選択資料を台帳登録</button></article>`;
  }

  function renderCandidates(parsed) {
    rankedCandidates = engine.rankResults(currentCriteria(), parsed.results);
    $("caseCandidateSummary").hidden = false;
    $("caseCandidateSummary").innerHTML = `<strong>公式検索結果</strong>：全${h(parsed.searchHits)}件中、XML収録${h(rankedCandidates.length)}件を一致度順に表示しています。高一致でも自動確定しません。`;
    $("officialCaseCandidateList").innerHTML = rankedCandidates.map(candidateHtml).join("") || '<div class="empty-state"><p>候補がありません。業務名を短くするか、番号・機関名・年度条件を見直してください。</p></div>';
  }

  async function importKkjXml(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { app.notify("検索XMLは10MB以下にしてください"); return; }
    try {
      const parsed = engine.parseKkjXml(await file.text());
      renderCandidates(parsed);
      app.notify(`公式検索候補${parsed.results.length}件を読み込みました`);
    } catch (error) {
      app.notify(error.message || "公式検索XMLを解析できませんでした");
    } finally {
      $("kkjXmlFileInput").value = "";
    }
  }

  function registerCandidate(row) {
    const candidate = rankedCandidates[Number(row.dataset.candidateIndex)];
    if (!candidate) return;
    const allSources = engine.recordSources(candidate);
    const selected = [...row.querySelectorAll(".case-candidate-source-select:checked")].map((box) => allSources[Number(box.dataset.sourceIndex)]).filter(Boolean);
    if (!selected.length) { app.notify("登録する資料を選択してください"); return; }
    const result = app.addCaseSources(selected);
    app.notify(`案件資料${result.added}件を台帳へ登録しました${result.duplicate ? `（重複${result.duplicate}件）` : ""}`);
    renderLedger();
  }

  function ledgerWarnings(sources) {
    const warnings = [];
    const adopted = sources.filter((source) => source.status === "adopted");
    if (sources.length && !adopted.length) warnings.push("採用済み資料がありません。原資料を開いて内容と最新版を確認し、採用へ変更してください。");
    const corrections = sources.filter((source) => source.documentType === "correction" && source.status !== "rejected");
    if (corrections.length && !corrections.some((source) => source.status === "adopted")) warnings.push("訂正・差替え候補があります。旧資料より先に内容を確認してください。");
    const adoptedByType = adopted.reduce((map, source) => map.set(source.documentType, (map.get(source.documentType) || 0) + 1), new Map());
    adoptedByType.forEach((count, type) => { if (count > 1) warnings.push(`${TYPE_LABELS[type] || type}が複数採用されています。改訂日と適用順を確認してください。`); });
    sources.filter((source) => source.discoveredVia === "手動登録" && source.url && !engine.isLikelyGovernmentUrl(source.url)).forEach((source) => warnings.push(`${source.title}：公式機関ドメインか確認できないURLです。`));
    return [...new Set(warnings)];
  }

  function sourceRowHtml(source) {
    const origin = [source.organization, source.publishedDate, source.discoveredVia].filter(Boolean).join("／") || "取得元未記録";
    const link = source.url && engine.isSafeWebUrl(source.url) ? `<a class="case-source-link" href="${h(source.url)}" target="_blank" rel="noopener">${h(source.url)}</a>` : '<span class="case-source-link">ローカル資料（URLなし）</span>';
    const hash = source.sha256 ? `SHA-256 ${source.sha256}` : "SHA-256 未登録";
    return `<article class="case-source-row" data-source-id="${h(source.id)}" data-status="${h(source.status)}"><select class="case-source-status" aria-label="採用状態">${statusOptions(source.status)}</select><div class="case-source-title"><strong>${h(source.title)}</strong><span>${h(origin)}${source.matchScore ? `／一致度${h(source.matchScore)}` : ""}</span></div><select class="case-source-type" aria-label="資料種別">${sourceTypeOptions(source.documentType)}</select>${link}<span class="case-source-hash">${h(hash)}</span><button class="button danger remove-case-source" type="button">台帳から削除</button></article>`;
  }

  function renderLedger() {
    const sources = app.getEstimate().caseFile?.sources || [];
    const warnings = ledgerWarnings(sources);
    $("caseSourceWarnings").hidden = warnings.length === 0;
    $("caseSourceWarnings").innerHTML = warnings.length ? `<ul>${warnings.map((warning) => `<li>${h(warning)}</li>`).join("")}</ul>` : "";
    $("caseSourceLedger").innerHTML = sources.map(sourceRowHtml).join("") || '<div class="empty-state"><p>案件資料はまだ登録されていません。公式検索候補、公式URL、または手元資料から登録してください。</p></div>';
  }

  function registerManualSource() {
    const title = $("manualSourceTitle").value.trim();
    const url = $("manualSourceUrl").value.trim();
    if (!title || !url) { app.notify("資料名とURLを入力してください"); return; }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") throw new Error("HTTPS required");
    } catch (_) { app.notify("HTTPSの公式URLを入力してください"); return; }
    const likelyOfficial = engine.isLikelyGovernmentUrl(url);
    const result = app.addCaseSources([{ title, url, documentType: $("manualSourceType").value, status: "review", discoveredVia: "手動登録", note: likelyOfficial ? "" : "公式機関ドメイン要確認" }]);
    if (result.added) { $("manualSourceTitle").value = ""; $("manualSourceUrl").value = ""; }
    app.notify(result.added ? "URLを資料台帳へ登録しました" : "同じ資料は登録済みです");
    renderLedger();
  }

  async function sha256(file) {
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  async function registerLocalSource(file) {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { app.notify("手元資料は30MB以下にしてください"); return; }
    try {
      const hash = await sha256(file);
      const result = app.addCaseSources([{ title: file.name, sha256: hash, documentType: "local", status: "review", discoveredVia: "手元資料", note: `${file.type || "形式不明"}／${file.size} bytes` }]);
      app.notify(result.added ? "手元資料のハッシュを台帳へ登録しました" : "同じ内容の資料は登録済みです");
      renderLedger();
    } catch (_) { app.notify("手元資料のハッシュを計算できませんでした"); }
    finally { $("caseSourceFileInput").value = ""; }
  }

  function bindEvents() {
    $("caseSearchPrefecture").innerHTML = '<option value="">全国・国機関</option>' + (window.SEKISAN_PREFECTURES || []).map((entry) => `<option value="${h(entry.code)}">${h(entry.name)}</option>`).join("");
    ["caseSearchProjectName", "caseSearchOrganization", "caseSearchDocumentNumber", "caseSearchFiscalYear", "caseSearchPrefecture"].forEach((id) => $(id).addEventListener("input", updateSearchLinks));
    $("caseSearchPrefecture").addEventListener("change", updateSearchLinks);
    $("refreshCaseSearchButton").addEventListener("click", syncCriteriaFromEstimate);
    $("importKkjXmlButton").addEventListener("click", () => $("kkjXmlFileInput").click());
    $("kkjXmlFileInput").addEventListener("change", (event) => importKkjXml(event.target.files?.[0]));
    $("officialCaseCandidateList").addEventListener("click", (event) => { const row = event.target.closest(".official-case-candidate"); if (row && event.target.closest(".register-case-candidate")) registerCandidate(row); });
    $("registerManualSourceButton").addEventListener("click", registerManualSource);
    $("registerLocalSourceButton").addEventListener("click", () => $("caseSourceFileInput").click());
    $("caseSourceFileInput").addEventListener("change", (event) => registerLocalSource(event.target.files?.[0]));
    $("caseSourceLedger").addEventListener("change", (event) => {
      const row = event.target.closest(".case-source-row");
      if (!row) return;
      if (event.target.classList.contains("case-source-status")) app.updateCaseSource(row.dataset.sourceId, { status: event.target.value });
      if (event.target.classList.contains("case-source-type")) app.updateCaseSource(row.dataset.sourceId, { documentType: event.target.value });
      renderLedger();
    });
    $("caseSourceLedger").addEventListener("click", (event) => {
      const row = event.target.closest(".case-source-row");
      if (!row || !event.target.closest(".remove-case-source")) return;
      if (window.confirm("この資料を案件台帳から削除しますか？ 元のファイルや公式サイト上の資料は削除されません。")) { app.removeCaseSource(row.dataset.sourceId); renderLedger(); }
    });
    document.addEventListener("ezsekisan:casefilechange", renderLedger);
  }

  bindEvents();
  syncCriteriaFromEstimate();
  renderLedger();
})();
