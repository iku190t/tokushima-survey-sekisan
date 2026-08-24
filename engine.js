(function (root, factory) {
  const catalog = typeof module === "object" && module.exports ? require("./data/unit-catalog.js") : root.SekisanUnitCatalog;
  const api = factory(catalog);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SekisanEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (unitCatalog) {
  "use strict";

  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const floorYen = (value) => Math.floor(Math.max(0, number(value)) + 1e-9);

  function roundHalfUp(value, decimals = 0) {
    const factor = 10 ** decimals;
    return Math.floor(number(value) * factor + 0.5 + 1e-10) / factor;
  }

  function truncateSignificant(value, digits = 4) {
    const source = floorYen(value);
    if (!source) return 0;
    const magnitude = Math.floor(Math.log10(source));
    const place = 10 ** Math.max(0, magnitude - digits + 1);
    return Math.floor(source / place) * place;
  }

  const defaultIntegerUnits = unitCatalog?.integerUnits || new Set(["式", "点", "箇所", "回", "機関", "業務", "戸", "人", "測線", "断面", "本", "枚", "筆", "日", "橋", "基", "社", "件", "ケース", "施設", "トンネル"]);

  function quantityRule(item, master = {}) {
    const unit = unitCatalog?.normalize(item?.unit || "式", "式") || item?.unit || "式";
    const configured = master.quantityRules?.[unit] || {};
    const decimals = Number.isInteger(item?.quantityDecimals)
      ? item.quantityDecimals
      : Number.isInteger(configured.decimals)
      ? configured.decimals
      : defaultIntegerUnits.has(unit)
      ? 0
      : master.rounding?.correctedQuantityDecimals ?? 3;
    return {
      decimals: Math.max(0, Math.min(6, decimals)),
      step: number(configured.step, decimals === 0 ? 1 : 10 ** -decimals),
      min: Math.max(0, number(configured.min, 0)),
      integer: decimals === 0,
    };
  }

  function normalizeQuantity(value, item, master = {}) {
    const fallback = number(item?.standardQuantity, 1);
    const rule = quantityRule(item, master);
    return roundHalfUp(Math.max(rule.min, number(value, fallback)), rule.decimals);
  }

  function overheadRate(base, rule) {
    const x = floorYen(base);
    if (x <= number(rule.lowerLimit)) return number(rule.lowerRate);
    if (x > number(rule.upperLimit)) return number(rule.upperRate);
    return roundHalfUp(number(rule.a) * x ** number(rule.b), number(rule.rateDecimals, 1));
  }

  function electronicDeliverableCost(directLabor, rule) {
    if (!rule) return 0;
    const inputUnit = number(rule.inputUnit, 1000);
    const outputUnit = number(rule.outputUnit, 1000);
    const laborInThousands = Math.floor(floorYen(directLabor) / inputUnit);
    if (laborInThousands <= 0) return 0;
    const thousands = Math.floor(number(rule.coefficient) * laborInThousands ** number(rule.exponent));
    const raw = thousands * outputUnit;
    return Math.min(number(rule.maximum), Math.max(number(rule.minimum), raw));
  }

  function travelCost(directLabor, mode, manualAmount, rule) {
    if (mode === "manual") return floorYen(manualAmount);
    const selected = rule?.[mode] || rule?.[rule?.defaultMode || "noLodging"];
    if (!selected) return floorYen(manualAmount);
    return Math.min(number(selected.maximum, Infinity), floorYen(floorYen(directLabor) * number(selected.rate)));
  }

  function roleCost(laborDays, roles) {
    return Object.entries(laborDays || {}).reduce((sum, [role, days]) => {
      return sum + number(days) * number(roles?.[role]?.price);
    }, 0);
  }

  function calculateItem(line, master, options = {}) {
    const item = line.masterItem || line;
    const quantity = normalizeQuantity(line.quantity, item, master);
    const standardQuantity = Math.max(1e-9, number(item.standardQuantity, 1));
    const correctionRate = number(line.correctionRate, 0);
    const ruleCorrectionRate = Object.values(line.correctionSelections || {}).reduce((sum, value) => sum + number(value), 0);
    const conditionValue = number(line.conditionValue, item.conditionFormula?.default);
    const conditionFactor = item.conditionFormula
      ? roundHalfUp(number(item.conditionFormula.a) * conditionValue + number(item.conditionFormula.b), master.rounding?.correctionDecimals ?? 2)
      : 1;
    const correctionFactor = roundHalfUp(conditionFactor + ruleCorrectionRate + correctionRate, master.rounding?.correctionDecimals ?? 2);

    const standardLabor = floorYen(roleCost(item.laborDays, master.roles));
    const standardMachine = item.expenseFormula
      ? floorYen((number(item.expenseFormula.a) * standardQuantity + number(item.expenseFormula.b)) * number(item.expenseFormula.unit, 1000))
      : floorYen(standardLabor * number(item.machineRate));
    const standardCommunication = floorYen(standardLabor * number(item.communicationRate));
    const standardMaterial = floorYen(standardLabor * number(item.materialRate));
    const standardDirect = standardLabor + standardMachine + standardCommunication + standardMaterial;

    let quantityFactor = quantity / standardQuantity;
    if (item.quantityFormula?.type === "linearPercent") {
      quantityFactor = roundHalfUp(
        (number(item.quantityFormula.a) * quantity + number(item.quantityFormula.b)) / 100,
        master.rounding?.correctionDecimals ?? 2
      );
    }
    const scale = quantityFactor;
    let labor = floorYen(standardLabor * scale * correctionFactor);
    let machine = item.expenseFormula
      ? floorYen((number(item.expenseFormula.a) * quantity + number(item.expenseFormula.b)) * number(item.expenseFormula.unit, 1000))
      : floorYen(labor * number(item.machineRate));
    let communication = floorYen(labor * number(item.communicationRate));
    let material = floorYen(labor * number(item.materialRate));
    if (item.pricingMode === "manualUnitPrice") {
      labor = 0;
      machine = item.manualCostComponent === "machine" ? floorYen(number(line.manualUnitPrice) * quantity) : 0;
      communication = 0;
      material = 0;
    }
    const rawCalculatedDirect = labor + machine + communication + material;
    const nonlinearPricing = Boolean(item.quantityFormula || item.expenseFormula || item.pricingMode === "manualUnitPrice");
    const rawUnitPrice = nonlinearPricing
      ? floorYen(rawCalculatedDirect / Math.max(quantity, 1e-9))
      : floorYen((standardDirect / standardQuantity) * correctionFactor);
    const unitPrice = item.pricingMode === "manualUnitPrice"
      ? floorYen(line.manualUnitPrice)
      : options.useFourSignificantDigits === false
      ? rawUnitPrice
      : truncateSignificant(rawUnitPrice, master.rounding?.surveyUnitPriceSignificantDigits || 4);
    const directWork = item.pricingMode === "manualUnitPrice"
      ? rawCalculatedDirect
      : nonlinearPricing
      ? (options.useFourSignificantDigits === false
          ? rawCalculatedDirect
          : truncateSignificant(rawCalculatedDirect, master.rounding?.surveyUnitPriceSignificantDigits || 4))
      : floorYen(unitPrice * quantity);
    const roundingAdjustment = directWork - labor - machine - communication - material;

    const precisionLabor = item.precisionEligible ? labor : 0;
    const precisionMachine = item.precisionEligible
      ? (item.expenseFormula ? floorYen(machine * number(item.expenseFormula.precisionMachineShare, 1)) : machine)
      : 0;
    const precisionRate = number(line.precisionRate, item.precisionRate);
    const precision = floorYen((precisionLabor + precisionMachine) * precisionRate);

    return {
      id: line.id,
      code: item.code,
      name: item.name,
      category: item.category,
      standard: item.standard,
      standardQuantity,
      unit: item.unit || "式",
      quantity,
      correctionRate,
      ruleCorrectionRate,
      totalCorrectionRate: ruleCorrectionRate + correctionRate,
      conditionValue,
      conditionFactor,
      correctionFactor,
      quantityFactor,
      manualUnitPrice: number(line.manualUnitPrice),
      standardLabor,
      standardMachine,
      standardCommunication,
      standardMaterial,
      standardDirect,
      standardUnitPrice: truncateSignificant(
        floorYen(standardDirect / standardQuantity),
        master.rounding?.surveyUnitPriceSignificantDigits || 4
      ),
      rawUnitPrice,
      unitPrice,
      labor,
      machine,
      communication,
      material,
      roundingAdjustment,
      precision,
      precisionRate,
      directWork,
      total: directWork + precision,
      source: item.source,
    };
  }

  function calculateEstimate(estimate, master) {
    const options = estimate.options || {};
    const lines = (estimate.lines || []).map((line) => calculateItem(line, master, options));
    const sum = (field) => lines.reduce((total, line) => total + number(line[field]), 0);
    const directLabor = sum("labor");
    const machine = sum("machine");
    const communication = sum("communication");
    const material = sum("material");
    const roundingAdjustment = sum("roundingAdjustment");
    const directWork = sum("directWork");
    const precision = sum("precision");

    const travelMode = options.travelMode || master.travel?.defaultMode || "manual";
    const travel = travelCost(directLabor, travelMode, estimate.costs?.travel, master.travel);
    const roundtrip = floorYen(estimate.costs?.roundtrip);
    const baseCost = floorYen(estimate.costs?.baseCost);
    const other = floorYen(estimate.costs?.other);
    const inspection = floorYen(estimate.costs?.inspection);
    const electronic = options.useElectronicDeliverable
      ? electronicDeliverableCost(directLabor, master.electronicDeliverable)
      : 0;
    const safetyRate = number(options.safetyRate, 0);
    const safetyBase = directWork + precision + electronic + travel + baseCost + other;
    const safety = floorYen(safetyBase * safetyRate);

    const directMeasurement = directWork + precision + electronic + travel + roundtrip + baseCost + other + inspection + safety;
    const overheadBase = Math.max(0, directMeasurement - inspection);
    const calculatedOverheadRate = overheadRate(overheadBase, master.overhead);
    const overheadBeforeAdjustment = floorYen(overheadBase * calculatedOverheadRate / 100);
    const workFeeBeforeAdjustment = directMeasurement + overheadBeforeAdjustment;
    const adjustmentUnit = options.adjustBusinessPrice === false ? 1 : number(master.rounding?.businessPriceUnit, 1000);
    const businessPrice = Math.floor(workFeeBeforeAdjustment / adjustmentUnit) * adjustmentUnit;
    const adjustment = workFeeBeforeAdjustment - businessPrice;
    const overhead = Math.max(0, overheadBeforeAdjustment - adjustment);
    const taxRate = number(options.taxRate, master.taxRate);
    const tax = floorYen(businessPrice * taxRate);
    const total = businessPrice + tax;

    return {
      lines,
      totals: {
        directLabor,
        machine,
        communication,
        material,
        roundingAdjustment,
        directWork,
        precision,
        electronic,
        travel,
        travelMode,
        roundtrip,
        baseCost,
        other,
        inspection,
        safetyBase,
        safetyRate,
        safety,
        directMeasurement,
        overheadBase,
        overheadRate: calculatedOverheadRate,
        overheadBeforeAdjustment,
        adjustment,
        overhead,
        businessPrice,
        taxRate,
        tax,
        total,
      },
    };
  }

  return {
    floorYen,
    roundHalfUp,
    truncateSignificant,
    quantityRule,
    normalizeQuantity,
    overheadRate,
    electronicDeliverableCost,
    travelCost,
    calculateItem,
    calculateEstimate,
  };
});
