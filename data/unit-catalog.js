(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SekisanUnitCatalog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // 「積算数量」は4業務の令和6～8年度マスターに収録した標準数量単位。
  // 「資料数量」は発注資料・数量総括表で現れるが、別単位へ固定換算できない単位。
  const definitions = [
    { id: "km", label: "km", quantityLabel: "延長（km）", kind: "decimal", decimals: 3, dimension: "length", aliases: ["㎞", "ｋｍ", "ＫＭ", "キロメートル"] },
    { id: "m", label: "m", quantityLabel: "延長（m）", kind: "decimal", decimals: 3, dimension: "length", aliases: ["ｍ", "メートル"] },
    { id: "km2", label: "km²", quantityLabel: "面積（km²）", kind: "decimal", decimals: 3, dimension: "area", aliases: ["㎢", "km2", "km^2", "平方キロメートル", "平方km", "平方キロ"] },
    { id: "m2", label: "m²", quantityLabel: "面積（m²）", kind: "decimal", decimals: 3, dimension: "area", aliases: ["㎡", "m2", "m^2", "平方メートル", "平方m"] },
    { id: "ha", label: "ha", quantityLabel: "面積（ha）", kind: "decimal", decimals: 3, dimension: "area", aliases: ["ヘクタール"] },
    { id: "m3", label: "m³", quantityLabel: "体積（m³）", kind: "decimal", decimals: 3, dimension: "volume", aliases: ["㎥", "m3", "m^3", "立方メートル"] },
    { id: "t", label: "t", quantityLabel: "重量（t）", kind: "decimal", decimals: 3, dimension: "mass", aliases: ["ｔ", "トン"] },
    { id: "時間", label: "時間", quantityLabel: "時間数", kind: "decimal", decimals: 3, dimension: "time", aliases: ["時", "hr", "h"] },
    { id: "式", label: "式", quantityLabel: "式数", kind: "integer", decimals: 0 },
    { id: "点", label: "点", quantityLabel: "点数", kind: "integer", decimals: 0, aliases: ["測点"] },
    { id: "箇所", label: "箇所", quantityLabel: "箇所数", kind: "integer", decimals: 0, aliases: ["ヶ所", "か所", "個所"] },
    { id: "回", label: "回", quantityLabel: "回数", kind: "integer", decimals: 0 },
    { id: "機関", label: "機関", quantityLabel: "機関数", kind: "integer", decimals: 0 },
    { id: "業務", label: "業務", quantityLabel: "業務数", kind: "integer", decimals: 0 },
    { id: "戸", label: "戸", quantityLabel: "戸数", kind: "integer", decimals: 0 },
    { id: "人", label: "人", quantityLabel: "人数", kind: "integer", decimals: 0 },
    { id: "測線", label: "測線", quantityLabel: "測線数", kind: "integer", decimals: 0 },
    { id: "断面", label: "断面", quantityLabel: "断面数", kind: "integer", decimals: 0 },
    { id: "本", label: "本", quantityLabel: "本数", kind: "integer", decimals: 0 },
    { id: "枚", label: "枚", quantityLabel: "枚数", kind: "integer", decimals: 0 },
    { id: "日", label: "日", quantityLabel: "日数", kind: "integer", decimals: 0 },
    { id: "橋", label: "橋", quantityLabel: "橋数", kind: "integer", decimals: 0 },
    { id: "基", label: "基", quantityLabel: "基数", kind: "integer", decimals: 0 },
    { id: "ケース", label: "ケース", quantityLabel: "ケース数", kind: "integer", decimals: 0 },
    { id: "トンネル", label: "トンネル", quantityLabel: "トンネル数", kind: "integer", decimals: 0 },
    { id: "タイプ", label: "タイプ", quantityLabel: "タイプ数", kind: "integer", decimals: 0 },
    { id: "坑口", label: "坑口", quantityLabel: "坑口数", kind: "integer", decimals: 0 },
    { id: "工法", label: "工法", quantityLabel: "工法数", kind: "integer", decimals: 0 },
    { id: "孔", label: "孔", quantityLabel: "孔数", kind: "integer", decimals: 0 },
    { id: "台", label: "台", quantityLabel: "台数", kind: "integer", decimals: 0 },
    { id: "観測所", label: "観測所", quantityLabel: "観測所数", kind: "integer", decimals: 0 },
    { id: "計器", label: "計器", quantityLabel: "計器数", kind: "integer", decimals: 0 },
    // 発注資料で使う離散単位。面積・延長などへは案件固有の根拠なしに換算しない。
    { id: "筆", label: "筆", quantityLabel: "筆数", kind: "integer", decimals: 0, scope: "source-document" },
    { id: "図葉", label: "図葉", quantityLabel: "図葉数", kind: "integer", decimals: 0, scope: "source-document", aliases: ["葉"] },
    { id: "部", label: "部", quantityLabel: "部数", kind: "integer", decimals: 0, scope: "source-document" },
    { id: "冊", label: "冊", quantityLabel: "冊数", kind: "integer", decimals: 0, scope: "source-document" },
    { id: "面", label: "面", quantityLabel: "面数", kind: "integer", decimals: 0, scope: "source-document" },
    { id: "組", label: "組", quantityLabel: "組数", kind: "integer", decimals: 0, scope: "source-document" },
    { id: "件", label: "件", quantityLabel: "件数", kind: "integer", decimals: 0, scope: "source-document" },
    { id: "施設", label: "施設", quantityLabel: "施設数", kind: "integer", decimals: 0, scope: "source-document" },
    { id: "社", label: "社", quantityLabel: "社数", kind: "integer", decimals: 0, scope: "source-document" }
  ].map((entry) => ({ scope: "estimate-quantity", aliases: [], ...entry }));

  const byId = new Map(definitions.map((entry) => [entry.id, entry]));
  const compact = (value) => String(value ?? "").trim().toLowerCase().replace(/[\s\u3000,，。:：()（）]/g, "");
  const aliasMap = new Map();
  definitions.forEach((entry) => [entry.id, entry.label, ...entry.aliases].forEach((alias) => aliasMap.set(compact(alias), entry.id)));

  function normalize(unit, fallback = "") {
    return aliasMap.get(compact(unit)) || (fallback ? aliasMap.get(compact(fallback)) || String(fallback) : String(unit || "").trim());
  }

  function definition(unit) {
    return byId.get(normalize(unit)) || null;
  }

  function aliasesFor(unit) {
    const entry = definition(unit);
    return entry ? [...new Set([entry.id, entry.label, ...entry.aliases])] : [String(unit || "").trim()].filter(Boolean);
  }

  function inputDomain(unit, options = {}) {
    const entry = definition(unit);
    const normalized = entry?.id || normalize(unit, "式");
    const integer = entry?.kind === "integer";
    const decimals = Number.isInteger(options.decimals) ? Math.max(0, Math.min(6, options.decimals)) : entry?.decimals ?? 3;
    return {
      unit: normalized,
      displayUnit: entry?.label || String(unit || normalized),
      known: Boolean(entry),
      kind: integer ? "integer" : "decimal",
      integer,
      decimals,
      step: decimals === 0 ? 1 : 10 ** -decimals,
      min: options.allowZero ? 0 : decimals === 0 ? 1 : 10 ** -decimals,
      label: integer ? "整数のみ" : `小数第${decimals}位まで`,
      scope: entry?.scope || "unknown"
    };
  }

  function conversionFactor(sourceUnit, targetUnit) {
    const source = definition(sourceUnit);
    const target = definition(targetUnit);
    if (!source || !target || source.dimension !== target.dimension) return source?.id === target?.id ? 1 : null;
    const meters = { km: 1000, m: 1 };
    const squareMeters = { km2: 1000000, ha: 10000, m2: 1 };
    if (source.dimension === "length") return meters[source.id] / meters[target.id];
    if (source.dimension === "area") return squareMeters[source.id] / squareMeters[target.id];
    return source.id === target.id ? 1 : null;
  }

  function compatibleUnits(targetUnit) {
    const target = definition(targetUnit);
    if (!target) return [];
    return definitions.filter((entry) => entry.scope === "estimate-quantity" && conversionFactor(entry.id, target.id) !== null);
  }

  function standardQuantityTokens() {
    return definitions.filter((entry) => entry.scope === "estimate-quantity").flatMap((entry) => [entry.id, entry.label, ...entry.aliases])
      .filter((value) => value && !/[a-z]/i.test(value) || /^(?:km|km2|m|m2|m3|ha|t)$/i.test(value))
      .sort((a, b) => b.length - a.length);
  }

  return {
    schemaVersion: 1,
    auditedFiscalYears: [2024, 2025, 2026],
    definitions,
    normalize,
    definition,
    aliasesFor,
    inputDomain,
    conversionFactor,
    compatibleUnits,
    standardQuantityTokens,
    integerUnits: new Set(definitions.filter((entry) => entry.kind === "integer").map((entry) => entry.id)),
    continuousUnits: new Set(definitions.filter((entry) => entry.kind === "decimal").map((entry) => entry.id)),
    quantityLabels: Object.fromEntries(definitions.map((entry) => [entry.id, entry.quantityLabel]))
  };
});
