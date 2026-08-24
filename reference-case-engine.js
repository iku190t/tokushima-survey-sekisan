(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ReferenceCaseEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const allowedItems = [
    "surveyBusinessPrice", "designLabor", "designBusinessPrice", "surveyPlanningLabor", "surveyPlanningBusinessPrice",
    "geologyLabor", "geologyBusinessPrice", "businessPrice", "tax", "total"
  ];

  function validate(reference) {
    if (!reference || reference.schemaVersion !== 1 || typeof reference.expectedTotals !== "object") return { valid: false, reason: "schemaVersion: 1 と expectedTotals が必要です。" };
    const forbidden = ["projectName", "client", "customer", "address", "location", "personName", "発注者", "業務名", "所在地", "担当者"];
    if (forbidden.some((key) => Object.prototype.hasOwnProperty.call(reference, key))) return { valid: false, reason: "案件名・発注者・所在地等を削除して匿名化してください。" };
    const keys = Object.keys(reference.expectedTotals);
    if (!keys.length || keys.some((key) => !allowedItems.includes(key))) return { valid: false, reason: "照合対象外の費目名、または空の費目一覧です。" };
    if (keys.some((key) => !Number.isFinite(Number(reference.expectedTotals[key])) || Number(reference.expectedTotals[key]) < 0)) return { valid: false, reason: "正解金額は0以上の数値で指定してください。" };
    return { valid: true };
  }

  function compare(reference, actualTotals) {
    const validation = validate(reference);
    if (!validation.valid) return { ...validation, rows: [], matched: false };
    const rows = Object.entries(reference.expectedTotals).map(([item, expected]) => {
      const actual = Math.floor(Number(actualTotals?.[item]) || 0);
      const expectedAmount = Math.floor(Number(expected));
      return { item, expected: expectedAmount, actual, difference: actual - expectedAmount, matched: actual === expectedAmount };
    });
    return { valid: true, rows, matched: rows.every((row) => row.matched), matchedCount: rows.filter((row) => row.matched).length, totalCount: rows.length };
  }

  return { allowedItems, validate, compare };
});
