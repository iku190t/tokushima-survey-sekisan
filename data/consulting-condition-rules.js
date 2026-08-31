window.CONSULTING_CONDITION_RULES = {
  schemaVersion: 1,
  auditedAt: "2026-08-24",
  rules: [
    {
      id: "mlit-road-concept-design-correction",
      fiscalYearFrom: 2015,
      serviceType: "design",
      presetLabelPattern: "道路概略設計[（(][AB][）)]",
      title: "道路概略設計の標準歩掛補正",
      aggregation: "additive",
      status: "verified-rule",
      inputs: [
        {
          id: "terrain",
          type: "select-rate",
          label: "地形区分",
          required: true,
          options: [
            { value: "flat", label: "平地", rate: 0 },
            { value: "hilly", label: "丘陵地", rate: 0.05 },
            { value: "urban", label: "市街地", rate: 0.10 },
            { value: "mountain", label: "山地", rate: 0.10 },
            { value: "steep", label: "急峻山地", rate: 0.20 }
          ]
        },
        { id: "provisionalPlan", type: "boolean-rate", label: "暫定計画を行う", rate: 0.15 },
        { id: "splitDeliverables", type: "boolean-rate", label: "工区ごとに成果品を分割", rate: 0.05 }
      ],
      calculationNote: "地形と該当する追加条件の補正係数を加算し、標準歩掛に乗じます。",
      sources: [
        { label: "平成23年度版 第3編 設計業務等 1-1-3・1-4", url: "https://www.mlit.go.jp/common/001068100.pdf", pages: [13, 20] },
        { label: "平成27年度改定内容（3） 道路概略設計補正の現行節番号", url: "https://www.mlit.go.jp/common/001082831.pdf", pages: [3] }
      ]
    },
    {
      id: "mlit-road-preliminary-design-correction",
      fiscalYearFrom: 2016,
      serviceType: "design",
      presetLabelPattern: "道路予備(?:修正)?設計[（(][AB][）)]",
      title: "道路予備・予備修正設計の標準歩掛補正",
      aggregation: "additive",
      status: "verified-rule",
      quantityFormula: { type: "linear", input: "quantity1", a: 0.8, b: 0.2, label: "0.8×設計延長(km)+0.2" },
      inputs: [
        {
          id: "terrain",
          type: "select-rate",
          label: "地形区分",
          required: true,
          options: [
            { value: "flat", label: "平地", rate: 0 },
            { value: "hilly", label: "丘陵地", rate: 0.05 },
            { value: "urban", label: "市街地", rate: 0.15 },
            { value: "mountain", label: "山地", rate: 0.15 },
            { value: "steep", label: "急峻山地", rate: 0.25 }
          ]
        },
        {
          id: "lanes",
          type: "select-rate",
          label: "車線数",
          required: true,
          options: [
            { value: "1-2", label: "1～2車線", rate: -0.05 },
            { value: "3-4", label: "3～4車線", rate: 0 },
            { value: "5-6", label: "5～6車線", rate: 0.05 },
            { value: "7-8", label: "7～8車線", rate: 0.10 }
          ]
        },
        { id: "multipleSection", type: "boolean-rate", label: "複断面（同一中心線で縦断線形を複数設計）", rate: 0.15 },
        { id: "provisionalPlan", type: "boolean-rate", label: "暫定計画を行う", rate: 0.15 },
        { id: "sidewalk", type: "boolean-rate", label: "歩道等（幅4m未満の側道を含む）を設計", rate: 0.05 },
        { id: "environmentalFacility", type: "boolean-rate", label: "力学計算を要しない道路環境関連施設を設計", rate: 0.05 },
        { id: "specialSlope", type: "boolean-rate", label: "力学計算を要しない特殊法面を道路設計と一体で設計", rate: 0.05 },
        { id: "splitDeliverables", type: "boolean-rate", label: "工区ごとに成果物を分割", rate: 0.10 },
        { id: "softGround", type: "boolean-rate", label: "軟弱地盤の路床入替・在来地盤改良等を含む", rate: 0.05 }
      ],
      calculationNote: "地形・車線数を含む該当補正係数をすべて加減算し、標準歩掛に乗じます。適用区間が異なる補正は区間ごとに分けて算定します。",
      sources: [
        { label: "平成23年度版 第3編 設計業務等 1-2-5・1-4", url: "https://www.mlit.go.jp/common/001068100.pdf", pages: [17, 20] },
        { label: "平成28年度改定内容（3） 道路予備設計補正の最終改定", url: "https://www.mlit.go.jp/common/001122927.pdf", pages: [7] }
      ]
    },
    {
      id: "mlit-road-detailed-design-correction",
      fiscalYearFrom: 2017,
      serviceType: "design",
      presetLabelPattern: "道路詳細設計[（(][AB][）)]",
      title: "道路詳細設計の標準歩掛補正",
      aggregation: "additive",
      status: "verified-rule",
      quantityFormula: { type: "linear", input: "quantity1", a: 0.5, b: 0.5, label: "0.5×設計延長(km)+0.5" },
      inputs: [
        {
          id: "terrain",
          type: "select-rate",
          label: "地形区分",
          required: true,
          help: "市街地は計画道路付近の家屋密度がおおむね60％以上の場合。切土高さ等の区分目安は出典の『補正の適用』を確認してください。",
          options: [
            { value: "flat", label: "平地", rate: 0 },
            { value: "hilly", label: "丘陵地", rate: 0.10 },
            { value: "mountain", label: "山地", rate: 0.15 },
            { value: "urban", label: "市街地", rate: 0.20 },
            { value: "steep", label: "急峻山地", rate: 0.30 }
          ]
        },
        {
          id: "lanes",
          type: "select-rate",
          label: "車線数",
          required: true,
          options: [
            { value: "1-2", label: "1～2車線", rate: -0.05 },
            { value: "3-4", label: "3～4車線", rate: 0 },
            { value: "5", label: "5車線", rate: 0.05 },
            { value: "6-7", label: "6～7車線", rate: 0.10 },
            { value: "8", label: "8車線", rate: 0.15 }
          ]
        },
        { id: "multipleSection", type: "boolean-rate", label: "複断面（同一中心線で縦断線形を複数設計）", rate: 0.20 },
        { id: "provisionalPlan", type: "boolean-rate", label: "暫定計画を行う", rate: 0.25 },
        { id: "sidewalk", type: "boolean-rate", label: "歩道等（幅4m未満の側道を含む）を設計", rate: 0.10 },
        { id: "noAncillary", type: "boolean-rate", label: "規定内の取付道路・付替水路・横断管渠等をいずれも設計しない", rate: -0.10, help: "取付道路は幅3m以下または1箇所30m以下、付替水路は幅2m以下または1箇所100m以下。一般構造物は別途積上げです。" },
        { id: "environmentalFacility", type: "boolean-rate", label: "力学計算を要しない道路環境関連施設を設計", rate: 0.05 },
        { id: "specialSlope", type: "boolean-rate", label: "力学計算を要しない特殊法面を道路設計と一体で設計", rate: 0.10 },
        { id: "splitDeliverables", type: "boolean-rate", label: "工区ごとに成果物を分割", rate: 0.10 },
        { id: "softGround", type: "boolean-rate", label: "軟弱地盤の路床入替・在来地盤改良等を含む", rate: 0.10 },
        { id: "trafficStaging", type: "boolean-rate", label: "現道拡幅等で施工途中の車線変更設計を含む", rate: 0.10 }
      ],
      calculationNote: "地形・車線数を含む該当補正係数をすべて加減算し、標準歩掛に乗じます。適用区間が異なる補正は区間ごとに分けて算定します。",
      sources: [
        { label: "平成23年度版 第3編 設計業務等 1-3-3・1-4", url: "https://www.mlit.go.jp/common/001068100.pdf", pages: [19, 20] },
        { label: "平成29年度改定内容（3） 道路詳細設計補正の最終改定", url: "https://www.mlit.go.jp/common/001177726.pdf", pages: [4] }
      ]
    }
  ]
};
