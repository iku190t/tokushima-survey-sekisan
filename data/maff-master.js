(function (root) {
  "use strict";

  const roles = {
    2026: {
      designPrincipal: 90300, designDirector: 82800, designLead: 70900, designEngineerA: 62600,
      designEngineerB: 49300, designEngineerC: 42500, designTechnician: 36700,
      surveyChief: 61000, surveyEngineer: 52700, surveyAssistantEngineer: 41300, surveyAssistant: 37700,
      surveyWorker: 29600, pilot: 62000, mechanic: 44200, cameraOperator: 51600,
      cameraAssistant: 38100, boatOperator: 42000,
      geologyEngineer: 58300, geologyChiefOperator: 45500, geologyOperator: 35200
    },
    2025: {
      designPrincipal: 88600, designDirector: 77500, designLead: 66900, designEngineerA: 59600,
      designEngineerB: 48500, designEngineerC: 40300, designTechnician: 36100,
      surveyChief: 60600, surveyEngineer: 52300, surveyAssistantEngineer: 41100, surveyAssistant: 34900,
      surveyWorker: 28700, pilot: 56300, mechanic: 43200, cameraOperator: 48200,
      cameraAssistant: 36400, boatOperator: 38300,
      geologyEngineer: 56000, geologyChiefOperator: 43800, geologyOperator: 34100
    },
    2024: {
      designPrincipal: 80200, designDirector: 75800, designLead: 64800, designEngineerA: 57000,
      designEngineerB: 47200, designEngineerC: 38400, designTechnician: 33600,
      surveyChief: 54600, surveyEngineer: 47100, surveyAssistantEngineer: 36900, surveyAssistant: 34600,
      surveyWorker: 25900, pilot: 56300, mechanic: 43200, cameraOperator: 43500,
      cameraAssistant: 36100, boatOperator: 36300,
      geologyEngineer: 53200, geologyChiefOperator: 41500, geologyOperator: 31400
    }
  };

  const sourceFor = (year, docId) => (root.MAFF_SOURCE_CATALOG?.documents || [])
    .find((entry) => Number(entry.fiscalYear) === Number(year) && entry.docId === docId);

  const roleNames = {
    surveyChief: "測量主任技師", surveyEngineer: "測量技師", surveyAssistantEngineer: "測量技師補",
    surveyAssistant: "測量助手", surveyWorker: "測量補助員", pilot: "操縦士", mechanic: "整備士",
    cameraOperator: "撮影士", cameraAssistant: "撮影助手", boatOperator: "測量船操縦士"
  };

  const precisionRateFor = (name) => {
    if (/1級基準点/.test(name)) return 0.10;
    if (/[234]級基準点/.test(name)) return 0.09;
    if (/[1234]級水準/.test(name)) return 0.09;
    if (/線形決定|IP設置|中心線|縦断|横断/.test(name)) return 0.10;
    if (/現地測量/.test(name)) return 0.05;
    return 0;
  };

  const surveyCategoryFor = (name) => {
    if (/基準点|地上埋設/.test(name)) return "基準点測量";
    if (/水準/.test(name)) return "水準測量";
    if (/現地測量/.test(name)) return "現地測量";
    return "路線測量";
  };

  const surveyQuantityFromUnit = (standardUnit) => {
    const normalized = String(standardUnit || "").replace(/,/g, "").replace(/㎡/g, "m2").trim();
    const match = normalized.match(/([0-9]+(?:\.[0-9]+)?)\s*(km2|km|点|式|業務)\s*当り/);
    if (!match) return { baseQuantity: 1, unit: "式", kind: "integer", decimals: 0, step: 1, min: 1 };
    const baseQuantity = Number(match[1]);
    const unit = match[2];
    const integer = ["点", "式", "業務"].includes(unit);
    return { baseQuantity, unit, kind: integer ? "integer" : "decimal", decimals: integer ? 0 : 3, step: integer ? 1 : .001, min: integer ? 1 : .001 };
  };

  const fieldSurveyOptions = [
    ["1/200 大市街地／平地", 1.2], ["1/200 市街地甲／平地", 1.1], ["1/200 市街地乙／平地", .9],
    ["1/200 市街地乙／丘陵地", 1.4], ["1/200 都市近郊／平地", .5], ["1/200 都市近郊／丘陵地", .8],
    ["1/200 耕地／平地", .2], ["1/200 耕地／丘陵地", .3], ["1/200 原野／丘陵地", .5],
    ["1/200 原野／低山地", 1.3], ["1/200 原野／高山地", 1.6], ["1/200 森林／丘陵地", .7],
    ["1/200 森林／低山地", 1.9], ["1/200 森林／高山地", 2.2], ["1/250 大市街地／平地", 1.2],
    ["1/250 市街地甲／平地", 1], ["1/250 市街地乙／平地", .8], ["1/250 市街地乙／丘陵地", 1.3],
    ["1/250 都市近郊／平地", .4], ["1/250 都市近郊／丘陵地", .7], ["1/250 耕地／平地", .1],
    ["1/250 耕地／丘陵地", .3], ["1/250 耕地／低山地", .9], ["1/250 原野／丘陵地", .4],
    ["1/250 原野／低山地", 1.2], ["1/250 原野／高山地", 1.5], ["1/250 森林／丘陵地", .6],
    ["1/250 森林／低山地", 1.8], ["1/250 森林／高山地", 2.1], ["1/500 大市街地／平地", .8],
    ["1/500 市街地甲／平地", .7], ["1/500 市街地乙／平地", .5], ["1/500 市街地乙／丘陵地", .8],
    ["1/500 都市近郊／平地", .2], ["1/500 都市近郊／丘陵地", .5], ["1/500 耕地／平地（標準）", 0],
    ["1/500 耕地／丘陵地", .2], ["1/500 耕地／低山地", .5], ["1/500 原野／平地", .1],
    ["1/500 原野／丘陵地", .3], ["1/500 原野／低山地", .7], ["1/500 原野／高山地", 1],
    ["1/500 森林／丘陵地", .4], ["1/500 森林／低山地", 1.4], ["1/500 森林／高山地", 1.7],
    ["1/1,000 大市街地／平地", .7], ["1/1,000 市街地甲／平地", .5], ["1/1,000 市街地乙／平地", .4],
    ["1/1,000 市街地乙／丘陵地", .7], ["1/1,000 都市近郊／平地", 0], ["1/1,000 都市近郊／丘陵地", .3],
    ["1/1,000 耕地／平地", -.1], ["1/1,000 耕地／丘陵地", 0], ["1/1,000 耕地／低山地", .2],
    ["1/1,000 原野／丘陵地", .1], ["1/1,000 原野／低山地", .4], ["1/1,000 原野／高山地", .7],
    ["1/1,000 森林／丘陵地", .3], ["1/1,000 森林／低山地", .7], ["1/1,000 森林／高山地", 1]
  ].map(([label, rate]) => ({ label, rate }));

  function surveyWorkItems(year) {
    const sourceRules = (root.MAFF_RULE_PACK?.rules || []).filter((rule) => Number(rule.fiscalYear) === Number(year) && rule.serviceType === "survey" && rule.docId === "survey");
    const groups = new Map();
    sourceRules.forEach((rule) => {
      const heading = rule.headings?.[rule.headings.length - 1] || {};
      if (!heading.code || heading.code === "1-3") return;
      const key = `${heading.code}|${rule.standardUnit}`;
      if (!groups.has(key)) groups.set(key, { heading, rules: [] });
      groups.get(key).rules.push(rule);
    });
    return [...groups.values()].map(({ heading, rules: entries }, index) => {
      const first = entries[0];
      const quantity = surveyQuantityFromUnit(first.standardUnit);
      const laborDays = {};
      entries.forEach((entry) => Object.entries(entry.roles || {}).forEach(([role, days]) => {
        laborDays[role] = Number(((laborDays[role] || 0) + Number(days || 0)).toFixed(6));
      }));
      const isField = heading.code === "4-1";
      const fixedFieldPlan = isField && quantity.unit === "業務";
      const name = fixedFieldPlan ? `${heading.title} 作業計画` : heading.title;
      const precisionRate = precisionRateFor(name);
      return {
        code: `maff-${heading.code}-${quantity.unit}-${index + 1}`,
        name,
        category: surveyCategoryFor(name),
        standard: `${quantity.baseQuantity}${quantity.unit}`,
        standardQuantity: Number(quantity.baseQuantity || 1), unit: quantity.unit || "式", laborDays,
        precisionExcludedLaborDays: {},
        machineRate: Math.max(...entries.map((entry) => Number(entry.machineRate || 0))),
        communicationRate: Math.max(...entries.map((entry) => Number(entry.communicationRate || 0))),
        materialRate: Math.max(...entries.map((entry) => Number(entry.materialRate || 0))),
        precisionRate, precisionEligible: precisionRate > 0, precisionRateOptions: null,
        applicability: isField ? { maximum: fixedFieldPlan ? 1 : .2, note: fixedFieldPlan ? "1業務当り" : "0.2km²以下" } : null,
        conditionFormula: null,
        correctionRules: isField ? [{ id: "maff-field-scale-terrain", label: "縮尺・地域・地形（表4-1）", options: fieldSurveyOptions }] : [],
        quantityFormula: isField && !fixedFieldPlan ? { type: "linearPercent", a: 718.95, b: 28.105, note: "y=718.95×A+28.105（%、A=作業量km²、y/100は小数第2位）" } : null,
        source: { standardPage: first.physicalPage, ratioPage: first.physicalPage, url: first.source?.url },
        verificationStatus: "maff-official-standard",
        quantityDecimals: Number(quantity.decimals ?? (quantity.kind === "integer" ? 0 : 3)),
        quantityInput: { unit: quantity.unit || "式", kind: quantity.kind || "decimal", decimals: Number(quantity.decimals ?? 3), step: Number(quantity.step ?? .001), min: Number(quantity.min ?? .001), status: "maff-official-unit" }
      };
    });
  }

  function surveyMaster(year) {
    const surveySource = sourceFor(year, "survey") || {};
    const notesSource = sourceFor(year, "notes") || {};
    const priceSource = sourceFor(year, "role-prices") || {};
    const lossSource = sourceFor(year, "survey-machinery") || {};
    const priceValues = roles[year] || roles[2026];
    return {
      schemaVersion: 4, id: `maff-r${year - 2018}-${year}`, label: "農林水産省・土地改良 測量業務",
      fiscalYear: year, standardSystem: "maff-land-improvement", jurisdictionCode: "maff", jurisdictionName: "農林水産省（土地改良）",
      jurisdictionType: "national", verificationStatus: "verified-official", scopeStatus: "maff-land-improvement", bundled: true,
      taxRate: .1,
      roles: Object.fromEntries(Object.entries(priceValues).filter(([id]) => roleNames[id]).map(([id, price]) => [id, { name: roleNames[id], price }])),
      overhead: year === 2024
        ? { lowerLimit: 500000, upperLimit: 100000000, lowerRate: 91.2, upperRate: 51.7, a: 371.23, b: -.107, rateDecimals: 1 }
        : { lowerLimit: 500000, upperLimit: 100000000, lowerRate: 95.8, upperRate: 61.4, a: 288.5, b: -.084, rateDecimals: 1 },
      electronicDeliverable: { enabledByDefault: true, coefficient: 2.3, exponent: .44, minimum: 10000, maximum: 170000, inputUnit: 1000, outputUnit: 1000 },
      travel: { defaultMode: "manual", manualOnly: true, note: "農林水産省の旅費交通費積算要領により、起点・経路・日程・宿泊条件から積み上げます。" },
      rounding: { correctedQuantityDecimals: 3, correctionDecimals: 2, componentAmount: "floor-yen", adjustedUnitPrice: "floor-yen", surveyUnitPriceSignificantDigits: 4, businessPriceUnit: 1000 },
      safetyRates: [{ name: "補正なし", rate: 0 }, { name: "大市街地", rate: .04 }, { name: "市街地（甲）", rate: .035 }, { name: "市街地（乙）・都市近郊", rate: .03 }, { name: "その他", rate: .025 }],
      workItems: surveyWorkItems(year),
      sourceLinks: [surveySource, notesSource, priceSource, lossSource].filter((entry) => entry.url).map((entry) => ({ label: `農林水産省 ${entry.title}`, url: entry.url }))
    };
  }

  root.MAFF_ROLE_PRICES = Object.fromEntries(Object.entries(roles).map(([year, values]) => {
    const source = sourceFor(Number(year), "role-prices") || {};
    return [Number(year), {
      era: `令和${Number(year) - 2018}年度`, effectiveFrom: `${year}-03-01`,
      sourceUrl: source.url || "https://www.maff.go.jp/j/nousin/sekkei/sekisan_kijun/index.html",
      sourceLabel: `農林水産省 令和${Number(year) - 2018}年度 技術者基準日額`, roles: values
    }];
  }));

  root.MAFF_CONSULTING_MASTER = {
    schemaVersion: 1,
    standardSystem: "maff-land-improvement",
    supportedYears: [2026, 2025, 2024],
    serviceTypes: [
      { id: "design", name: "設計業務", calculationSystem: "design", roleGroup: "design" },
      { id: "planning", name: "業務関係資料・積算参考歩掛", calculationSystem: "design", roleGroup: "design" },
      { id: "geologyAnalysis", name: "地質・土質解析等調査", calculationSystem: "design", roleGroup: "design" },
      { id: "geologyGeneral", name: "地質・土質一般調査", calculationSystem: "geology", roleGroup: "geology" }
    ],
    roleGroups: {
      design: [
        { id: "designPrincipal", name: "主任技術者" }, { id: "designDirector", name: "技師長" },
        { id: "designLead", name: "主任技師" }, { id: "designEngineerA", name: "技師（A）" },
        { id: "designEngineerB", name: "技師（B）" }, { id: "designEngineerC", name: "技師（C）" },
        { id: "designTechnician", name: "技術員" }
      ],
      survey: [
        { id: "surveyChief", name: "測量主任技師" }, { id: "surveyEngineer", name: "測量技師" },
        { id: "surveyAssistantEngineer", name: "測量技師補" }, { id: "surveyAssistant", name: "測量助手" },
        { id: "surveyWorker", name: "測量補助員" }, { id: "pilot", name: "操縦士" },
        { id: "mechanic", name: "整備士" }, { id: "cameraOperator", name: "撮影士" },
        { id: "cameraAssistant", name: "撮影助手" }, { id: "boatOperator", name: "測量船操縦士" }
      ],
      geology: [
        { id: "geologyEngineer", name: "地質調査技師" },
        { id: "geologyChiefOperator", name: "主任地質調査員" },
        { id: "geologyOperator", name: "地質調査員" }
      ]
    },
    taskNames: {
      design: ["農業水利施設設計", "水路設計", "頭首工設計", "ポンプ場設計", "ため池設計", "任意作業"],
      planning: ["業務関係資料", "積算参考歩掛", "機能診断", "現場技術業務", "任意作業"],
      geologyAnalysis: ["解析等調査業務", "資料整理", "断面図作成", "総合解析", "任意作業"],
      geologyGeneral: ["機械ボーリング", "サンプリング", "サウンディング・原位置試験", "現場内小運搬", "足場仮設", "任意作業"]
    },
    verifiedPresets: [],
    designRules: {
      alpha: 0.35, beta: 0.35,
      electronic: {
        detailed: { coefficient: 0.4, exponent: 0.69, minimum: 10000, maximum: 250000 },
        other: { coefficient: 10.0, exponent: 0.26, minimum: 15000, maximum: 150000 }
      }
    },
    surveyRulesByYear: {
      2024: { overhead: { lowerLimit: 500000, upperLimit: 100000000, lowerRate: 91.2, upperRate: 51.7, a: 371.23, b: -0.107, rateDecimals: 1 } },
      2025: { overhead: { lowerLimit: 500000, upperLimit: 100000000, lowerRate: 95.8, upperRate: 61.4, a: 288.5, b: -0.084, rateDecimals: 1 } },
      2026: { overhead: { lowerLimit: 500000, upperLimit: 100000000, lowerRate: 95.8, upperRate: 61.4, a: 288.5, b: -0.084, rateDecimals: 1 } }
    },
    geologyRules: {
      overhead: { lowerLimit: 1000000, upperLimit: 30000000, lowerRate: 82.5, upperRate: 60.6, a: 290.2, b: -0.091, rateDecimals: 1 },
      electronic: { coefficient: 4.7, exponent: 0.38, minimum: 0, maximum: 260000 }
    },
    sources: (root.MAFF_SOURCE_CATALOG?.documents || []).map((entry) => ({ label: `農林水産省 ${entry.title}`, url: entry.url, fiscalYear: entry.fiscalYear }))
  };
  root.MAFF_SURVEY_MASTERS = [2026, 2025, 2024].map(surveyMaster);
})(typeof globalThis !== "undefined" ? globalThis : this);
