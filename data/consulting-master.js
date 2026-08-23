window.CONSULTING_MASTER = {
  schemaVersion: 2,
  supportedYears: [2026, 2025, 2024],
  serviceTypes: [
    { id: "design", name: "土木設計業務", calculationSystem: "design", roleGroup: "design" },
    { id: "planning", name: "調査・計画業務", calculationSystem: "design", roleGroup: "design" },
    { id: "geologyAnalysis", name: "地質解析等調査業務", calculationSystem: "design", roleGroup: "design" },
    { id: "geologyGeneral", name: "地質一般調査業務", calculationSystem: "geology", roleGroup: "geology" }
  ],
  roleGroups: {
    design: [
      { id: "designPrincipal", name: "主任技術者" },
      { id: "designDirector", name: "理事・技師長" },
      { id: "designLead", name: "主任技師" },
      { id: "designEngineerA", name: "技師（A）" },
      { id: "designEngineerB", name: "技師（B）" },
      { id: "designEngineerC", name: "技師（C）" },
      { id: "designTechnician", name: "技術員" }
    ],
    geology: [
      { id: "geologyEngineer", name: "地質調査技師" },
      { id: "geologyChiefOperator", name: "主任地質調査員" },
      { id: "geologyOperator", name: "地質調査員" }
    ]
  },
  taskNames: {
    design: ["業務計画", "設計条件の確認", "現地踏査", "設計計算", "設計図作成", "数量計算", "施工計画", "照査", "報告書作成", "打合せ", "任意作業"],
    planning: ["調査計画", "計画条件の整理", "資料収集整理", "現地踏査", "現地調査", "解析・検討", "計画立案", "照査", "報告書作成", "打合せ", "任意作業"],
    geologyAnalysis: ["既存資料整理", "資料整理とりまとめ", "断面図等の作成", "地質解析", "地盤定数の設定", "工法検討", "総合解析とりまとめ", "照査", "報告書作成", "打合せ", "任意作業"],
    geologyGeneral: ["機械ボーリング", "標準貫入試験", "サンプリング", "サウンディング", "原位置試験", "孔内水平載荷試験", "現場透水試験", "地下水位観測", "地すべり調査", "土質・岩石試験", "現場管理", "コア整理", "打合せ", "任意作業"]
  },
  verifiedPresets: [
    {
      id: "design-note",
      label: "設計留意書の作成（1業務）",
      serviceType: "design",
      source: "令和8年度 土木設計業務等積算基準 3-1-4",
      roles: { designLead: 0.5, designEngineerA: 1.0 }
    }
  ],
  designRules: {
    alpha: 0.35,
    beta: 0.35,
    electronic: {
      detailed: { coefficient: 6.9, exponent: 0.45, minimum: 20000, maximum: 700000 },
      other: { coefficient: 5.1, exponent: 0.38, minimum: 20000, maximum: 250000 }
    }
  },
  geologyRules: {
    overhead: { lowerLimit: 1000000, upperLimit: 30000000, lowerRate: 82.5, upperRate: 60.6, a: 290.2, b: -0.091, rateDecimals: 1 }
  },
  sources: [
    { label: "国土交通省 令和8年度 土木設計業務等積算基準", url: "https://www.mlit.go.jp/tec/content/001867426.pdf" },
    { label: "国土交通省 令和8年度 地質調査積算基準", url: "https://www.mlit.go.jp/tec/content/001867425.pdf" },
    { label: "国土交通省 設計業務委託等技術者単価（年度別）", url: "https://www.mlit.go.jp/tec/gyoumu_tanka.html" },
    { label: "国土交通省 設計業務等標準積算基準書（年度別）", url: "https://www.mlit.go.jp/tec/gyoumu_sekisan.html" }
  ]
};
