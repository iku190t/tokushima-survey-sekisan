(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ConsultingEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const floorYen = (value) => Math.floor(Math.max(0, number(value)) + 1e-9);
  const roundHalfUp = (value, decimals = 0) => {
    const factor = 10 ** decimals;
    return Math.floor(number(value) * factor + 0.5 + 1e-10) / factor;
  };
  const normalizeDays = (value) => roundHalfUp(Math.max(0, number(value)), 3);

  function overheadRate(base, rule) {
    const target = floorYen(base);
    if (!target) return 0;
    if (target <= number(rule?.lowerLimit)) return number(rule?.lowerRate);
    if (target > number(rule?.upperLimit)) return number(rule?.upperRate);
    return roundHalfUp(number(rule?.a) * target ** number(rule?.b), number(rule?.rateDecimals, 1));
  }

  function electronicDeliverableCost(directLabor, rule) {
    if (!rule || floorYen(directLabor) <= 0) return 0;
    const laborThousands = Math.floor(floorYen(directLabor) / 1000);
    if (!laborThousands) return 0;
    const calculated = Math.floor(number(rule.coefficient) * laborThousands ** number(rule.exponent)) * 1000;
    return Math.min(number(rule.maximum), Math.max(number(rule.minimum), calculated));
  }

  function calculateRoleLine(line, rolePrices, serviceTypes) {
    const service = (serviceTypes || []).find((entry) => entry.id === line.serviceType);
    const days = normalizeDays(line.days);
    const dailyRate = floorYen(rolePrices?.[line.role]);
    return {
      id: line.id,
      serviceType: line.serviceType,
      calculationSystem: service?.calculationSystem || "design",
      serviceName: service?.name || line.serviceType || "未分類",
      taskName: String(line.taskName || "任意作業").trim() || "任意作業",
      role: line.role,
      days,
      dailyRate,
      amount: floorYen(days * dailyRate),
    };
  }

  function calculateEstimate(state, master, rolePrices, surveyBusinessPrice = 0) {
    const lines = (state?.lines || []).map((line) => calculateRoleLine(line, rolePrices, master?.serviceTypes));
    const designLines = lines.filter((line) => line.calculationSystem === "design");
    const geologyLines = lines.filter((line) => line.calculationSystem === "geology");
    const sumAmount = (entries) => entries.reduce((sum, line) => sum + line.amount, 0);

    const designLabor = sumAmount(designLines);
    const designDirectExpenses = floorYen(state?.costs?.designDirectExpenses);
    const electronicMode = state?.options?.electronicMode || "none";
    const electronic = electronicMode === "none"
      ? 0
      : electronicDeliverableCost(designLabor, master?.designRules?.electronic?.[electronicMode]);
    const alpha = number(master?.designRules?.alpha, 0.35);
    const beta = number(master?.designRules?.beta, 0.35);
    const otherCost = floorYen(designLabor * alpha / Math.max(1e-9, 1 - alpha));
    const designBusinessCost = designLabor + designDirectExpenses + electronic + otherCost;
    const generalManagement = floorYen(designBusinessCost * beta / Math.max(1e-9, 1 - beta));
    const designBusinessPrice = designBusinessCost + generalManagement;

    const geologyLabor = sumAmount(geologyLines);
    const geologyDirectNonLabor = floorYen(state?.costs?.geologyDirectNonLabor);
    const geologyIndirect = floorYen(state?.costs?.geologyIndirect);
    const geologyExcluded = floorYen(state?.costs?.geologyExcluded);
    const geologyTarget = geologyLabor + geologyDirectNonLabor + geologyIndirect;
    const geologyOverheadRate = overheadRate(geologyTarget, master?.geologyRules?.overhead);
    const geologyOverhead = floorYen(geologyTarget * geologyOverheadRate / 100);
    const geologyBusinessPrice = geologyTarget + geologyOverhead + geologyExcluded;

    const includedSurveyBusinessPrice = state?.options?.includeSurvey ? floorYen(surveyBusinessPrice) : 0;
    const rawBusinessPrice = includedSurveyBusinessPrice + designBusinessPrice + geologyBusinessPrice;
    const adjustmentUnit = state?.options?.adjustBusinessPrice ? 1000 : 1;
    const businessPrice = Math.floor(rawBusinessPrice / adjustmentUnit) * adjustmentUnit;
    const adjustment = rawBusinessPrice - businessPrice;
    const taxRate = Math.max(0, number(state?.options?.taxRate, 0.1));
    const tax = floorYen(businessPrice * taxRate);

    return {
      lines,
      totals: {
        surveyBusinessPrice: includedSurveyBusinessPrice,
        designLabor,
        designDirectExpenses,
        electronic,
        otherCost,
        designBusinessCost,
        generalManagement,
        designBusinessPrice,
        geologyLabor,
        geologyDirectNonLabor,
        geologyIndirect,
        geologyExcluded,
        geologyTarget,
        geologyOverheadRate,
        geologyOverhead,
        geologyBusinessPrice,
        rawBusinessPrice,
        adjustment,
        businessPrice,
        taxRate,
        tax,
        total: businessPrice + tax,
      }
    };
  }

  return { floorYen, roundHalfUp, normalizeDays, overheadRate, electronicDeliverableCost, calculateRoleLine, calculateEstimate };
});
