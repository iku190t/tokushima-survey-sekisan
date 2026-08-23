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
  // 参考資料（総則）の端数規定：補正後数量は小数第3位、補正係数・変化率は小数第2位。
  const normalizeDays = (value) => roundHalfUp(Math.max(0, number(value)), 3);
  const normalizeCorrectionFactor = (value) => roundHalfUp(Math.max(0, number(value)), 2);

  const quantityUnitLabels = {
    km: "延長（km）", m: "延長（m）", m2: "面積（m²）", 箇所: "箇所数", 橋: "橋数",
    基: "基数", トンネル: "トンネル数", 日: "日数", ケース: "ケース数", 断面: "断面数",
    坑口: "坑口数", タイプ: "タイプ数", 業務: "業務数", 工法: "工法数", 機関: "機関数",
    孔: "孔数", 回: "回数", 式: "数量"
  };
  const integerQuantityUnits = new Set(["箇所", "橋", "基", "トンネル", "日", "ケース", "断面", "坑口", "タイプ", "業務", "工法", "機関", "孔", "回", "式"]);
  const referenceOnlyPatterns = [
    /編成人員|編成人肩/,
    /市場単価.*規格|規格区分/,
    /日当り作業量/,
    /架設.*撤去.*規格/,
    /機械器具損料.*規格/
  ];

  function classifyPresetCoverage(preset, conditionRule = null) {
    if (!preset) return { status: "unavailable", canCalculate: false, label: "利用不可", note: "業務種類を選択してください。" };
    if (preset.verificationStatus !== "national-reference") {
      return {
        status: "verified-complete",
        canCalculate: true,
        label: "原表確認済み",
        note: "表示した標準数量と人工を原資料の該当表で確認済みです。案件固有の特記条件は別途確認してください。"
      };
    }
    if (conditionRule?.status === "verified-rule") {
      return {
        status: "verified-rule",
        canCalculate: true,
        label: "出典付き条件規則を反映",
        note: "表示した補正・控除条件を数量比と標準歩掛へ反映します。案件固有の特記条件は別途照合してください。"
      };
    }
    if (referenceOnlyPatterns.some((pattern) => pattern.test(String(preset.label || "")))) {
      return {
        status: "reference-only",
        canCalculate: false,
        label: "参照専用・自動計算不可",
        note: "作業班の編成、規格区分または日当たり作業量を示す表です。単独で数量に掛けて人工へ変換できないため、関連表との計算規則を実装するまで自動追加しません。"
      };
    }
    return {
      status: "incomplete-rule",
      canCalculate: false,
      label: "条件規則未実装・自動計算不可",
      note: "職種別人工表は収録済みですが、補正式、適用範囲、追加・控除、参照表との関係が未構造化です。出典付き条件規則を実装するまで自動追加しません。"
    };
  }

  function parseStandardQuantity(standardUnit) {
    const source = String(standardUnit || "標準表1式")
      .replace(/㎡/g, "m2").replace(/m²/g, "m2").replace(/ｍ/g, "m").replace(/ｋｍ/gi, "km")
      .replace(/，/g, ",").replace(/あたり/g, "当り").replace(/\s+/g, "");
    const pattern = /(\d[\d,]*(?:\.\d+)?)\s*(km|m2|m|箇所|橋|基|トンネル|日|ケース|断面|坑口|タイプ|業務|工法|機関|孔|回|式)(?=当り)/g;
    const dimensions = [];
    let match;
    while ((match = pattern.exec(source))) {
      const baseQuantity = Number(match[1].replace(/,/g, ""));
      const unit = match[2];
      if (!(baseQuantity > 0)) continue;
      const prefixStart = dimensions.length ? dimensions[dimensions.length - 1]._end : 0;
      const prefix = source.slice(prefixStart, match.index).replace(/^当り/, "").replace(/^単位[:：]?/, "");
      dimensions.push({
        key: `quantity${dimensions.length + 1}`,
        label: prefix ? `${prefix}${quantityUnitLabels[unit] || `数量（${unit}）`}` : quantityUnitLabels[unit] || `数量（${unit}）`,
        unit,
        baseQuantity,
        integer: integerQuantityUnits.has(unit),
        decimals: integerQuantityUnits.has(unit) ? 0 : 3,
        _end: pattern.lastIndex
      });
    }
    if (!dimensions.length) dimensions.push({ key: "quantity1", label: "適用数", unit: "式", baseQuantity: 1, integer: true, decimals: 0, _end: 0 });
    return { source, dimensions: dimensions.map(({ _end, ...dimension }) => dimension) };
  }

  function calculateStandardQuantity(standardUnit, values) {
    const specification = parseStandardQuantity(standardUnit);
    const normalized = [];
    let multiplier = 1;
    for (const dimension of specification.dimensions) {
      const raw = values?.[dimension.key];
      if (raw === "" || raw === null || raw === undefined) return { valid: false, reason: `${dimension.label}を入力してください`, specification, quantities: normalized, multiplier: 0 };
      let quantity = number(raw, NaN);
      if (!Number.isFinite(quantity) || quantity <= 0) return { valid: false, reason: `${dimension.label}を0より大きい値で入力してください`, specification, quantities: normalized, multiplier: 0 };
      if (dimension.integer && !Number.isInteger(quantity)) return { valid: false, reason: `${dimension.label}は整数で入力してください`, specification, quantities: normalized, multiplier: 0 };
      quantity = dimension.integer ? Math.floor(quantity) : roundHalfUp(quantity, dimension.decimals);
      if (!(quantity > 0)) return { valid: false, reason: `${dimension.label}を0より大きい値で入力してください`, specification, quantities: normalized, multiplier: 0 };
      normalized.push({ ...dimension, quantity });
      multiplier *= quantity / dimension.baseQuantity;
    }
    return { valid: true, reason: "", specification, quantities: normalized, multiplier };
  }

  function standardQuantitySummary(calculation) {
    if (!calculation?.valid) return "";
    const quantityText = calculation.quantities.map((entry) => `${entry.quantity.toLocaleString("ja-JP")} ${entry.unit}`).join(" × ");
    const standardText = calculation.quantities.map((entry) => `${entry.baseQuantity.toLocaleString("ja-JP")} ${entry.unit}`).join(" × ");
    return `${quantityText} ÷ 標準 ${standardText} ＝ ${roundHalfUp(calculation.multiplier, 6).toLocaleString("ja-JP")}倍`;
  }

  function findConditionRule(preset, conditionRules, fiscalYear) {
    return (conditionRules?.rules || []).find((rule) => {
      if (rule.serviceType && rule.serviceType !== preset?.serviceType) return false;
      if (number(fiscalYear) < number(rule.fiscalYearFrom, 0)) return false;
      if (rule.fiscalYearTo && number(fiscalYear) > number(rule.fiscalYearTo)) return false;
      try { return new RegExp(rule.presetLabelPattern).test(String(preset?.label || "")); }
      catch (_error) { return false; }
    }) || null;
  }

  function calculateConditionCorrection(rule, values) {
    if (!rule) return { valid: true, factor: 1, rate: 0, entries: [], summary: "補正規則なし" };
    const entries = [];
    let rate = 0;
    for (const input of rule.inputs || []) {
      if (input.type === "select-rate") {
        const selected = (input.options || []).find((option) => option.value === values?.[input.id]);
        if (!selected && input.required) return { valid: false, reason: `${input.label}を選択してください`, factor: 0, rate: 0, entries };
        if (!selected) continue;
        const selectedRate = number(selected.rate);
        rate += selectedRate;
        entries.push({ id: input.id, label: input.label, selection: selected.label, rate: selectedRate });
      } else if (input.type === "boolean-rate" && Boolean(values?.[input.id])) {
        const selectedRate = number(input.rate);
        rate += selectedRate;
        entries.push({ id: input.id, label: input.label, selection: "該当", rate: selectedRate });
      }
    }
    rate = roundHalfUp(rate, 4);
    const factor = normalizeCorrectionFactor(1 + rate);
    if (!(factor > 0)) return { valid: false, reason: "補正後の係数が0以下です。条件の組合せを確認してください", factor: 0, rate, entries };
    const rateText = `${rate >= 0 ? "+" : ""}${roundHalfUp(rate * 100, 2)}%`;
    return { valid: true, reason: "", factor, rate, entries, summary: `補正 ${rateText} → ${factor}倍` };
  }

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

  return { floorYen, roundHalfUp, normalizeDays, normalizeCorrectionFactor, classifyPresetCoverage, parseStandardQuantity, calculateStandardQuantity, standardQuantitySummary, findConditionRule, calculateConditionCorrection, overheadRate, electronicDeliverableCost, calculateRoleLine, calculateEstimate };
});
