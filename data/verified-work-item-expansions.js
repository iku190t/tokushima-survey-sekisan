window.SEKISAN_VERIFIED_WORK_ITEM_EXPANSIONS = [
  {
    fiscalYear: 2026,
    replaceCode: "11-3-2",
    sourceLabel: "国土交通省 令和8年度 積算基準・標準歩掛等改定内容（UAVレーザ測量）",
    sourceUrl: "https://www.mlit.go.jp/tec/content/001984600.pdf",
    items: [
      { code: "11-3-2-1", name: "UAVレーザ測量 現地踏査", laborDays: { surveyEngineer: 1.9, surveyAssistantEngineer: 1.7 } },
      { code: "11-3-2-2", name: "UAVレーザ測量 計測計画の作成", laborDays: { surveyChief: 0.5, surveyEngineer: 1.4, surveyAssistantEngineer: 0.6 } },
      { code: "11-3-2-3", name: "UAVレーザ測量 固定局の設置", laborDays: { surveyEngineer: 1.3, surveyAssistantEngineer: 0.9 } },
      { code: "11-3-2-4", name: "UAVレーザ測量 調整点の設置", laborDays: { surveyEngineer: 2.7, surveyAssistantEngineer: 2.5, surveyAssistant: 3.2 } },
      { code: "11-3-2-5", name: "UAVレーザ測量 計測", laborDays: { surveyEngineer: 3.6, surveyAssistantEngineer: 3.4, surveyAssistant: 4.1 } },
      { code: "11-3-2-6", name: "UAVレーザ測量 オリジナルデータの作成", laborDays: { surveyEngineer: 5.3, surveyAssistantEngineer: 5.9, surveyAssistant: 4.9 } },
      { code: "11-3-2-7", name: "UAVレーザ測量 その他の成果データの作成", laborDays: { surveyEngineer: 9.4, surveyAssistantEngineer: 10.9, surveyAssistant: 7.8 } },
      { code: "11-3-2-8", name: "UAVレーザ測量 成果等の整理", laborDays: { surveyEngineer: 4.6, surveyAssistantEngineer: 5.6 } }
    ].map((entry) => ({
      ...entry,
      category: "UAVレーザ測量",
      standard: "0.1km²",
      standardQuantity: 0.1,
      unit: "km²",
      precisionExcludedLaborDays: {},
      machineRate: 0,
      communicationRate: 0,
      materialRate: 0,
      precisionRate: 0,
      precisionEligible: false,
      precisionRateOptions: null,
      applicability: { maximum: 0.2, unit: "km²", note: "測定面積0.2km²以下" },
      conditionFormula: null,
      correctionRules: [],
      quantityFormula: null,
      source: { standardPage: 104, ratioPage: null },
      reviewRequired: false,
      manualCostRequired: true,
      manualCostNote: "機械経費等と精度管理費係数は別途計上"
    }))
  }
];
