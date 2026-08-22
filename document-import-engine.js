(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DocumentImportEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const FULLWIDTH = "０１２３４５６７８９．，：－＋（）／　";
  const HALFWIDTH = "0123456789.,:-+()/ ";
  const COST_LABELS = [
    { key: "designDirectExpenses", label: "設計・調査計画・解析の積上直接経費", patterns: ["積上直接経費", "直接経費"] },
    { key: "geologyDirectNonLabor", label: "地質一般：直接調査費（人件費以外）", patterns: ["直接調査費(人件費以外)", "直接調査費人件費以外"] },
    { key: "geologyIndirect", label: "地質一般：間接調査費", patterns: ["間接調査費"] },
    { key: "geologyExcluded", label: "地質一般：諸経費対象外費用", patterns: ["諸経費対象外費用", "対象外費用"] }
  ];

  function normalizeCharacters(value) {
    return String(value ?? "").replace(/[①-⑳]/g, (char) => String(char.codePointAt(0) - 0x2460 + 1))
      .replace(/[０-９．，：－＋（）／　]/g, (char) => HALFWIDTH[FULLWIDTH.indexOf(char)] || char)
      .replace(/[㎢]/g, "km2").replace(/km²/gi, "km2").replace(/平方キロメートル/g, "km2")
      .replace(/[㎞]/g, "km").replace(/キロメートル/g, "km").replace(/人・日/g, "人日")
      .replace(/\r\n?/g, "\n");
  }

  function compact(value) {
    return normalizeCharacters(value).toLowerCase().replace(/[\s\u3000・･,，。:：;；「」『』【】\[\]{}()（）]/g, "");
  }

  function visibleLine(value) {
    let normalized = normalizeCharacters(value);
    if (/(?:[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]\s){3,}/u.test(normalized)) {
      normalized = normalized.replace(/(?<=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])\s+(?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])/gu, "");
    }
    return normalized.replace(/[\t ]+/g, " ").trim();
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function unitAliases(unit) {
    const normalized = compact(unit);
    if (normalized === "km2") return ["km2", "平方km", "平方キロ"];
    if (normalized === "km") return ["km", "キロ"];
    if (normalized === "m2") return ["m2", "平方m", "平方メートル"];
    if (normalized === "m") return ["m", "メートル"];
    return [visibleLine(unit)];
  }

  function numericMatches(line, aliases) {
    const source = normalizeCharacters(line).replace(/,/g, "");
    const unitPattern = aliases.map(escapeRegExp).join("|");
    const regex = new RegExp(`(^|[^/\\d])([0-9]+(?:\\.[0-9]+)?)\\s*(?:${unitPattern})(?![a-zA-Z0-9])`, "gi");
    const values = [];
    let match;
    while ((match = regex.exec(source))) values.push({ value: Number(match[2]), index: match.index + match[1].length });
    return values.filter((entry) => Number.isFinite(entry.value));
  }

  function surveyMatchScore(line, item) {
    const lineKey = compact(line);
    const codeKey = compact(item.code);
    const nameKey = compact(item.name);
    let score = 0;
    if (codeKey && lineKey.includes(codeKey)) score += 120;
    if (nameKey && lineKey.includes(nameKey)) score += 100;
    const base = compact(String(item.name).split(/[（(]/)[0]);
    if (base.length >= 4 && lineKey.includes(base)) score += 45;
    const category = compact(item.category);
    if (category.length >= 2 && lineKey.includes(category)) score += 36;
    const qualifiers = String(item.name).split(/[\s　・･、,（）()]/).map(compact).filter((token) => token.length >= 2 && token !== base);
    qualifiers.forEach((token) => { if (lineKey.includes(token)) score += Math.min(14, token.length * 2); });
    return score;
  }

  function detectSurveyCandidates(page, surveyMaster) {
    const lines = normalizeCharacters(page.text).split("\n").map(visibleLine).filter(Boolean);
    const items = Array.isArray(surveyMaster?.workItems) ? surveyMaster.workItems : [];
    const found = [];
    lines.forEach((line, lineIndex) => {
      const ranked = items.map((item) => ({ item, score: surveyMatchScore(line, item) }))
        .filter((entry) => entry.score >= 35)
        .sort((a, b) => b.score - a.score);
      if (!ranked.length) return;
      const best = ranked[0];
      const values = numericMatches(line, unitAliases(best.item.unit));
      if (!values.length) return;
      const quantity = values[values.length - 1].value;
      const ambiguous = Boolean(ranked[1] && ranked[1].score >= best.score - 5);
      const confidence = best.score >= 100 && !ambiguous ? "high" : best.score >= 60 && !ambiguous ? "medium" : "low";
      found.push({
        id: `survey-${page.pageNumber}-${lineIndex}-${best.item.code}`,
        kind: "survey",
        selected: confidence !== "low",
        code: best.item.code,
        quantity,
        unit: best.item.unit,
        label: best.item.name,
        page: page.pageNumber,
        method: page.method,
        confidence,
        sourceText: line,
        alternatives: ranked.slice(0, 5).map((entry) => entry.item.code)
      });
    });
    return found;
  }

  function roleEntries(master) {
    return Object.entries(master?.roleGroups || {}).flatMap(([group, roles]) => (roles || []).map((role) => ({ ...role, group })));
  }

  function taskEntries(master) {
    return Object.entries(master?.taskNames || {}).flatMap(([serviceType, tasks]) => (tasks || []).filter((task) => task !== "任意作業").map((task) => ({ serviceType, task })));
  }

  function inferService(line, role, matchedTask) {
    if (role?.group === "geology") return "geologyGeneral";
    if (matchedTask) return matchedTask.serviceType;
    const key = compact(line);
    if (/(地質解析|地盤定数|総合解析)/.test(key)) return "geologyAnalysis";
    if (/(ボーリング|標準貫入|サンプリング|原位置試験|地質調査)/.test(key)) return "geologyGeneral";
    if (/(調査計画|資料収集|現地調査|計画立案)/.test(key)) return "planning";
    return "design";
  }

  function detectConsultingCandidates(page, consultingMaster) {
    const lines = normalizeCharacters(page.text).split("\n").map(visibleLine).filter(Boolean);
    const roles = roleEntries(consultingMaster);
    const tasks = taskEntries(consultingMaster);
    const found = [];
    lines.forEach((line, lineIndex) => {
      const lineKey = compact(line);
      roles.forEach((role) => {
        const roleKey = compact(role.name);
        if (!roleKey || !lineKey.includes(roleKey)) return;
        const forward = new RegExp(`${escapeRegExp(roleKey)}[^0-9]{0,12}([0-9]+(?:\\.[0-9]+)?)(?:人日|人工|人)`);
        const reverse = new RegExp(`([0-9]+(?:\\.[0-9]+)?)(?:人日|人工|人)[^0-9]{0,12}${escapeRegExp(roleKey)}`);
        const match = lineKey.match(forward) || lineKey.match(reverse);
        if (!match) return;
        const days = Number(match[1]);
        if (!Number.isFinite(days) || days <= 0) return;
        const matchedTask = tasks.map((entry) => ({ ...entry, score: lineKey.includes(compact(entry.task)) ? compact(entry.task).length : 0 }))
          .filter((entry) => entry.score).sort((a, b) => b.score - a.score)[0];
        const serviceType = inferService(line, role, matchedTask);
        const taskName = matchedTask?.task || visibleLine(line.replace(role.name, "").replace(/[0-9.,]+\s*(?:人日|人工|人)/, "").slice(0, 60)) || "資料取込作業";
        found.push({
          id: `consulting-${page.pageNumber}-${lineIndex}-${role.id}`,
          kind: "consulting",
          selected: true,
          serviceType,
          taskName,
          role: role.id,
          days,
          page: page.pageNumber,
          method: page.method,
          confidence: matchedTask ? "high" : "medium",
          sourceText: line
        });
      });
    });
    return found;
  }

  function detectCostCandidates(page) {
    const lines = normalizeCharacters(page.text).split("\n").map(visibleLine).filter(Boolean);
    const found = [];
    lines.forEach((line, lineIndex) => {
      const lineKey = compact(line);
      COST_LABELS.forEach((definition) => {
        if (!definition.patterns.some((pattern) => lineKey.includes(compact(pattern)))) return;
        const moneySource = normalizeCharacters(line).replace(/(?<=\d)[,.](?=\d{3}\s*円)/g, "").replace(/,/g, "");
        const money = moneySource.match(/([0-9]+(?:\.[0-9]+)?)\s*円/);
        if (!money) return;
        found.push({
          id: `cost-${page.pageNumber}-${lineIndex}-${definition.key}`,
          kind: "consultingCost",
          selected: false,
          costKey: definition.key,
          label: definition.label,
          amount: Math.floor(Number(money[1])),
          page: page.pageNumber,
          method: page.method,
          confidence: "low",
          sourceText: line
        });
      });
    });
    return found;
  }

  const METADATA_DEFINITIONS = [
    { key: "projectName", label: "業務名", aliases: ["業務名", "業務件名", "件名", "委託名"], max: 180 },
    { key: "orderingParty", label: "発注者", aliases: ["発注者", "委託者", "発注機関", "契約担当官"], max: 120 },
    { key: "department", label: "担当部署", aliases: ["担当部署", "担当課", "所管課", "発注担当課", "担当事務所"], max: 120 },
    { key: "contactName", label: "担当者", aliases: ["担当者", "監督員", "調査職員", "主任調査員"], max: 80 },
    { key: "workLocation", label: "業務場所", aliases: ["業務場所", "履行場所", "施行場所", "調査場所", "業務箇所"], max: 180 },
    { key: "contractPeriod", label: "履行期間", aliases: ["履行期間", "業務期間", "委託期間", "工期", "履行期限"], max: 180 },
    { key: "documentNumber", label: "文書・業務番号", aliases: ["業務番号", "公告番号", "契約番号", "整理番号", "文書番号", "調達案件番号"], max: 80 },
    { key: "documentDate", label: "公告・資料日", aliases: ["公告日", "通知日", "資料日", "作成日", "契約日"], max: 80 }
  ];

  function metadataLineEntries(pages) {
    return pages.flatMap((page) => normalizeCharacters(page.text).split("\n")
      .map(visibleLine).filter(Boolean)
      .map((text) => ({ text, page: page.pageNumber, method: page.method })));
  }

  function fieldFromLines(entries, definition) {
    for (const entry of entries) {
      for (const alias of definition.aliases) {
        const escaped = escapeRegExp(alias);
        const match = entry.text.match(new RegExp(`(?:^|[|｜])\\s*${escaped}\\s*(?:[:：]|[ \\t]{1,})\\s*(.+)$`));
        if (!match) continue;
        const value = visibleLine(match[1]).replace(/^[：:・|｜\-]+\s*/, "").trim().slice(0, definition.max);
        if (!value) continue;
        return {
          key: definition.key,
          label: definition.label,
          value,
          selected: true,
          page: entry.page,
          method: entry.method,
          confidence: entry.method === "ocr" ? "medium" : "high",
          sourceText: entry.text
        };
      }
    }
    return null;
  }

  function detectMetadata(pages, jurisdictions) {
    const entries = metadataLineEntries(pages);
    const fields = METADATA_DEFINITIONS.map((definition) => fieldFromLines(entries, definition)).filter(Boolean);
    const fieldValue = (key) => fields.find((field) => field.key === key)?.value || "";
    const joined = entries.map((entry) => entry.text).join("\n");
    const yearMatch = joined.match(/令和\s*([0-9]+)\s*年度/);
    const fiscalYear = yearMatch ? 2018 + Number(yearMatch[1]) : null;
    const yearEntry = yearMatch ? entries.find((entry) => /令和\s*[0-9]+\s*年度/.test(entry.text)) : null;
    const all = compact(joined);
    const jurisdiction = (jurisdictions || []).find((entry) => all.includes(compact(entry.name)));
    if (jurisdiction) {
      const entry = entries.find((candidate) => compact(candidate.text).includes(compact(jurisdiction.name)));
      fields.push({
        key: "jurisdiction",
        label: "積算地域・発注機関マスター",
        value: jurisdiction.name,
        code: jurisdiction.code,
        selected: false,
        page: entry?.page || 1,
        method: entry?.method || "text",
        confidence: entry?.method === "ocr" ? "low" : "medium",
        sourceText: entry?.text || jurisdiction.name,
        affectsCalculation: true
      });
    }
    if (Number.isFinite(fiscalYear)) {
      fields.push({
        key: "fiscalYear",
        label: "積算年度マスター",
        value: fiscalYear,
        displayValue: `令和${fiscalYear - 2018}年度`,
        selected: false,
        page: yearEntry?.page || 1,
        method: yearEntry?.method || "text",
        confidence: yearEntry?.method === "ocr" ? "low" : "medium",
        sourceText: yearEntry?.text || yearMatch[0],
        affectsCalculation: true
      });
    }
    return {
      projectName: fieldValue("projectName"),
      orderingParty: fieldValue("orderingParty"),
      department: fieldValue("department"),
      contactName: fieldValue("contactName"),
      workLocation: fieldValue("workLocation"),
      contractPeriod: fieldValue("contractPeriod"),
      documentNumber: fieldValue("documentNumber"),
      documentDate: fieldValue("documentDate"),
      fiscalYear: Number.isFinite(fiscalYear) ? fiscalYear : null,
      jurisdictionCode: jurisdiction?.code || "",
      jurisdictionName: jurisdiction?.name || "",
      fields
    };
  }

  function deduplicate(candidates) {
    const seen = new Set();
    return candidates.filter((candidate) => {
      const key = candidate.kind === "survey"
        ? `${candidate.kind}:${candidate.code}:${candidate.quantity}:${candidate.page}`
        : candidate.kind === "consulting"
          ? `${candidate.kind}:${candidate.serviceType}:${candidate.taskName}:${candidate.role}:${candidate.days}:${candidate.page}`
          : `${candidate.kind}:${candidate.costKey}:${candidate.amount}:${candidate.page}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function analyze(pages, surveyMaster, consultingMaster, jurisdictions) {
    const safePages = (pages || []).map((page, index) => ({ pageNumber: Number(page.pageNumber) || index + 1, text: String(page.text || ""), method: page.method === "ocr" ? "ocr" : "text" }));
    const candidates = deduplicate(safePages.flatMap((page) => [
      ...detectSurveyCandidates(page, surveyMaster),
      ...detectConsultingCandidates(page, consultingMaster),
      ...detectCostCandidates(page)
    ]));
    const warnings = [];
    if (!candidates.length) warnings.push("積算へ対応付けられる数量・人工を検出できませんでした。原文を確認し、必要項目を手入力してください。");
    if (safePages.some((page) => page.method === "ocr")) warnings.push("OCRを使用したページがあります。数字・小数点・単位を原文画像と必ず照合してください。");
    if (candidates.some((candidate) => candidate.confidence === "low")) warnings.push("対応先が曖昧な候補は初期選択を外しています。採用する場合は項目と数量を修正してください。");
    return { metadata: detectMetadata(safePages, jurisdictions), pages: safePages, candidates, warnings };
  }

  return { normalizeCharacters, compact, numericMatches, detectMetadata, analyze };
});
