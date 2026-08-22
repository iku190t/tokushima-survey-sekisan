(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.OfficialCaseEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const API_BASE = "https://www.kkj.go.jp/api/";
  const PORTAL_BASE = "https://www.kkj.go.jp/s/";

  function decodeXml(value) {
    return String(value || "").replace(/^<!\[CDATA\[|\]\]>$/g, "")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&amp;/g, "&").trim();
  }

  function tag(block, name) {
    const match = String(block || "").match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    return match ? decodeXml(match[1]) : "";
  }

  function normalize(value) {
    return String(value || "").normalize("NFKC").toLowerCase()
      .replace(/令和\s*([0-9]+)\s*年度/g, (_, year) => String(2018 + Number(year)))
      .replace(/[\s\u3000・･,，。:：;；「」『』【】\[\]{}()（）\-‐―ー_\/\\]/g, "");
  }

  function bigrams(value) {
    const text = normalize(value);
    if (text.length < 2) return text ? [text] : [];
    return Array.from({ length: text.length - 1 }, (_, index) => text.slice(index, index + 2));
  }

  function similarity(left, right) {
    const a = bigrams(left);
    const b = bigrams(right);
    if (!a.length || !b.length) return 0;
    const remaining = [...b];
    let common = 0;
    a.forEach((gram) => {
      const index = remaining.indexOf(gram);
      if (index >= 0) { common += 1; remaining.splice(index, 1); }
    });
    return (2 * common) / (a.length + b.length);
  }

  function fiscalYearOf(dateText) {
    const match = String(dateText || "").match(/(20[0-9]{2})-([0-9]{2})/);
    if (!match) return null;
    const year = Number(match[1]);
    return Number(match[2]) >= 4 ? year : year - 1;
  }

  function sourceType(title) {
    const key = normalize(title);
    if (/(訂正|差替|差し替|変更|正誤)/.test(key)) return "correction";
    if (/(質問回答|質疑回答|回答書)/.test(key)) return "qa";
    if (/(数量総括|数量表|数量計算)/.test(key)) return "quantity";
    if (/(金抜|設計書|内訳書)/.test(key)) return "designDocument";
    if (/(特記仕様|仕様書)/.test(key)) return "specification";
    if (/(入札説明)/.test(key)) return "instructions";
    if (/(公告|公示)/.test(key)) return "notice";
    return "other";
  }

  function parseKkjXml(xmlText) {
    const xml = String(xmlText || "");
    const error = tag(xml, "Error");
    if (error) throw new Error(`公式検索APIエラー：${error}`);
    const searchHits = Number(tag(xml, "SearchHits")) || 0;
    const results = [...xml.matchAll(/<SearchResult(?:\s[^>]*)?>([\s\S]*?)<\/SearchResult>/gi)].map((match) => {
      const block = match[1];
      const attachmentsBlock = tag(block, "Attachments");
      const attachments = [...attachmentsBlock.matchAll(/<Attachment(?:\s[^>]*)?>([\s\S]*?)<\/Attachment>/gi)].map((entry) => ({
        title: tag(entry[1], "Name") || "添付資料",
        url: tag(entry[1], "Uri")
      })).filter((entry) => entry.url);
      return {
        key: tag(block, "Key"),
        projectName: tag(block, "ProjectName"),
        organizationName: tag(block, "OrganizationName"),
        externalUrl: tag(block, "ExternalDocumentURI"),
        acquiredDate: tag(block, "Date"),
        issueDate: tag(block, "CftIssueDate"),
        deadline: tag(block, "PeriodEndTime"),
        location: tag(block, "Location"),
        prefectureCode: tag(block, "LgCode"),
        prefectureName: tag(block, "PrefectureName"),
        cityName: tag(block, "CityName"),
        category: tag(block, "Category"),
        procedureType: tag(block, "ProcedureType"),
        description: tag(block, "ProjectDescription"),
        attachments
      };
    });
    return { version: tag(xml, "Version"), searchHits, results };
  }

  function compactQuery(value, maxLength = 90) {
    return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
  }

  function fiscalPeriod(fiscalYear) {
    const year = Number(fiscalYear);
    return Number.isFinite(year) && year >= 2000 ? `${year}-04-01/${year + 1}-03-31` : "";
  }

  function buildKkjApiUrl(criteria = {}) {
    const projectName = compactQuery(criteria.projectName);
    const documentNumber = compactQuery(criteria.documentNumber, 50);
    const organization = compactQuery(criteria.organizationName, 60);
    const query = documentNumber || projectName || organization || "測量";
    const params = new URLSearchParams({ Query: query, Count: "50", Category: "3" });
    if (projectName) params.set("Project_Name", projectName);
    if (organization) params.set("Organization_Name", organization);
    if (/^[0-9]{2}$/.test(String(criteria.prefectureCode || ""))) params.set("LG_Code", criteria.prefectureCode);
    const period = fiscalPeriod(criteria.fiscalYear);
    if (period) params.set("CFT_Issue_Date", period);
    return `${API_BASE}?${params.toString()}`;
  }

  function buildKkjPortalUrl(criteria = {}) {
    const params = new URLSearchParams({ U: "0-all", X: "検　索", rc: "50", ca: "3" });
    const projectName = compactQuery(criteria.projectName);
    const documentNumber = compactQuery(criteria.documentNumber, 50);
    const organization = compactQuery(criteria.organizationName, 60);
    if (documentNumber) params.set("S", documentNumber);
    if (projectName) params.set("ti", projectName);
    if (organization) params.set("on", organization);
    if (/^[0-9]{2}$/.test(String(criteria.prefectureCode || ""))) params.set("pr", criteria.prefectureCode);
    return `${PORTAL_BASE}?${params.toString()}`;
  }

  function scoreRecord(criteria = {}, record = {}) {
    const reasons = [];
    let score = 0;
    const haystack = normalize(`${record.projectName} ${record.description}`);
    const number = normalize(criteria.documentNumber);
    if (number && haystack.includes(number)) { score += 45; reasons.push("業務・公告番号一致"); }
    const projectSimilarity = similarity(criteria.projectName, record.projectName);
    if (projectSimilarity >= .88) { score += 35; reasons.push("業務名ほぼ一致"); }
    else if (projectSimilarity >= .62) { score += 24; reasons.push("業務名部分一致"); }
    else if (projectSimilarity >= .4) { score += 12; reasons.push("業務名に共通語"); }
    const organization = normalize(criteria.organizationName);
    const recordOrganization = normalize(record.organizationName);
    if (organization && recordOrganization && (organization.includes(recordOrganization) || recordOrganization.includes(organization))) { score += 15; reasons.push("発注機関一致"); }
    if (criteria.prefectureCode && String(criteria.prefectureCode) === String(record.prefectureCode)) { score += 8; reasons.push("都道府県一致"); }
    const recordFiscalYear = fiscalYearOf(record.issueDate || record.acquiredDate);
    if (Number(criteria.fiscalYear) && Number(criteria.fiscalYear) === recordFiscalYear) { score += 8; reasons.push("年度一致"); }
    const location = normalize(criteria.location);
    if (location && normalize(`${record.location} ${record.description}`).includes(location)) { score += 5; reasons.push("履行場所一致"); }
    score = Math.min(100, score);
    return { score, reasons, projectSimilarity, level: score >= 75 ? "high" : score >= 45 ? "medium" : "low" };
  }

  function rankResults(criteria, records) {
    return (records || []).map((record) => ({ ...record, match: scoreRecord(criteria, record) }))
      .sort((a, b) => b.match.score - a.match.score || String(b.issueDate).localeCompare(String(a.issueDate)));
  }

  function isLikelyGovernmentUrl(value) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      return url.protocol === "https:" && (host === "www.kkj.go.jp" || host.endsWith(".go.jp") || host.endsWith(".lg.jp") || /^(?:www\.)?(?:pref|city|town|vill)\./.test(host));
    } catch (_) { return false; }
  }

  function isSafeWebUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (_) { return false; }
  }

  function recordSources(record) {
    const base = {
      organization: record.organizationName,
      publishedDate: String(record.issueDate || record.acquiredDate || "").slice(0, 10),
      discoveredVia: "官公需情報ポータルAPI",
      portalKey: record.key,
      matchScore: record.match?.score || 0,
      status: "review"
    };
    const sources = [];
    if (record.externalUrl && isSafeWebUrl(record.externalUrl)) sources.push({ ...base, title: record.projectName || "公告情報", url: record.externalUrl, documentType: sourceType(record.projectName) });
    (record.attachments || []).forEach((attachment) => {
      if (isSafeWebUrl(attachment.url)) sources.push({ ...base, title: attachment.title, url: attachment.url, documentType: sourceType(attachment.title) });
    });
    return sources;
  }

  return { API_BASE, PORTAL_BASE, normalize, similarity, fiscalYearOf, sourceType, parseKkjXml, buildKkjApiUrl, buildKkjPortalUrl, scoreRecord, rankResults, isLikelyGovernmentUrl, isSafeWebUrl, recordSources };
});
