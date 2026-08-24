window.CONSULTING_WORK_CATALOG = {
  serviceIdsByScope: {
    design: ["design"],
    planning: ["planning"],
    geology: ["geologyAnalysis", "geologyGeneral"]
  },
  keywordDefinitions: {
    design: [
      { id: "all", label: "すべて", prefixes: [] },
      { id: "common", label: "共通", prefixes: ["1-"] },
      { id: "road", label: "道路", prefixes: ["2-", "3-", "4-", "5-", "6-"] },
      { id: "structure", label: "構造物", prefixes: ["7-"] },
      { id: "bridge", label: "橋梁", prefixes: ["8-"] },
      { id: "underground", label: "地下・共同溝", prefixes: ["9-", "11-", "12-"] },
      { id: "temporary", label: "仮設", prefixes: ["13-"] },
      { id: "tunnel", label: "トンネル", prefixes: ["10-"] },
      { id: "river", label: "河川", prefixes: ["14-"] },
      { id: "sabo", label: "砂防", prefixes: ["15-"] },
      { id: "other", label: "その他", prefixes: [], fallback: true }
    ],
    planning: [
      { id: "all", label: "すべて", prefixes: [] },
      { id: "common", label: "共通", prefixes: ["1-"] },
      { id: "river", label: "河川・水辺", prefixes: ["2-", "3-"] },
      { id: "road", label: "道路防災", prefixes: ["4-1"] },
      { id: "bridge", label: "橋梁点検", prefixes: ["4-2"] },
      { id: "tunnel", label: "トンネル点検", prefixes: ["4-3"] },
      { id: "hydrology", label: "水文・観測", prefixes: ["5-"] },
      { id: "other", label: "その他", prefixes: [], fallback: true }
    ],
    geology: [
      { id: "all", label: "すべて", prefixes: [] },
      { id: "common", label: "共通", prefixes: ["1-"] },
      { id: "boring", label: "ボーリング", prefixes: ["2-1"] },
      { id: "sampling", label: "サンプリング", prefixes: ["2-2"] },
      { id: "field-test", label: "原位置試験", prefixes: ["2-3"] },
      { id: "transport", label: "運搬", prefixes: ["2-4"] },
      { id: "temporary", label: "仮設", prefixes: ["2-5"] },
      { id: "indirect", label: "間接調査", prefixes: ["2-6", "3-5"] },
      { id: "exploration", label: "物理探査", prefixes: ["3-4"] },
      { id: "soft-ground", label: "軟弱地盤", prefixes: ["4-2"] },
      { id: "analysis", label: "解析", prefixes: ["2-7", "5-"] },
      { id: "other", label: "その他", prefixes: [], fallback: true }
    ]
  }
};
