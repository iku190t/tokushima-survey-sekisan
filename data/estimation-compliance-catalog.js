window.ESTIMATION_COMPLIANCE_CATALOG = {
  schemaVersion: 1,
  auditedAt: "2026-08-24",
  systems: [
    { id: "mlit-general", name: "国土交通省・一般土木（設計／測量／調査計画／地質）", status: "supported-r6-r8", selectable: true, source: "https://www.mlit.go.jp/tec/gyoumu_sekisan.html", note: "令和6～8年度の全国標準参考。発注機関の適用通知と特記仕様は案件ごとに確認する。" },
    { id: "port", name: "港湾・海岸・船舶関係", status: "separate-system", selectable: false, source: "https://www.mlit.go.jp/kowan/kowan_fr5_000019.html", note: "港湾請負工事積算基準、水中部調査、船舶損料等の別体系。一般土木マスターを流用しない。" },
    { id: "airport", name: "航空局・空港施設関係", status: "separate-system", selectable: false, source: "https://www.mlit.go.jp/koku/koku_tk9_000006.html", note: "空港請負工事積算基準、航空灯火・電気・無線等の別体系。航空測量とは別分野。" },
    { id: "agriculture", name: "農業農村整備・土地改良", status: "separate-system", selectable: false, source: "https://www.maff.go.jp/j/nousin/sekkei/sekisan_kijun/sekisankijun_kaisei/index.html", note: "農林水産省の調査・測量・設計業務積算基準。国交省一般土木とは別マスター。" },
    { id: "sewerage", name: "下水道", status: "separate-system", selectable: false, source: "https://www.mlit.go.jp/mizukokudo/sewerage/mizukokudo_sewerage_tk_001075.html", note: "下水道用設計標準歩掛表の別体系。令和8年度は第1～3巻と正誤表を確認する。" },
    { id: "water", name: "水道施設整備", status: "separate-system", selectable: false, source: "https://www.mlit.go.jp/mizukokudo/watersupply/stf_seisakunitsuite_bunya_topics_bukyoku_kenkou_suido_yosan_01_00001.html", note: "水道施設整備費に係る年度別歩掛表の別体系。" },
    { id: "forestry", name: "森林整備保全・治山・林道", status: "separate-system", selectable: false, source: "https://www.rinya.maff.go.jp/j/sekou/gijutu/tyousasankou.html", note: "林野庁の調査・測量・設計・計画業務積算要領の別体系。" },
    { id: "public-building", name: "官庁営繕・建築設計", status: "separate-system", selectable: false, source: "https://www.mlit.go.jp/gobuild/kijun_gyoumusekisankijun.htm", note: "官庁施設の設計業務等積算基準。土木設計業務等標準積算基準とは別体系。" }
  ],
  regionalAuthorities: [
    { id: "unselected", name: "発注機関を選択してください", url: "" },
    { id: "hokkaido", name: "北海道開発局", url: "https://www.hkd.mlit.go.jp/" },
    { id: "tohoku", name: "東北地方整備局", url: "https://www.thr.mlit.go.jp/" },
    { id: "kanto", name: "関東地方整備局", url: "https://www.ktr.mlit.go.jp/" },
    { id: "hokuriku", name: "北陸地方整備局", url: "https://www.hrr.mlit.go.jp/" },
    { id: "chubu", name: "中部地方整備局", url: "https://www.cbr.mlit.go.jp/" },
    { id: "kinki", name: "近畿地方整備局", url: "https://www.kkr.mlit.go.jp/" },
    { id: "chugoku", name: "中国地方整備局", url: "https://www.cgr.mlit.go.jp/" },
    { id: "shikoku", name: "四国地方整備局", url: "https://www.skr.mlit.go.jp/" },
    { id: "kyushu", name: "九州地方整備局", url: "https://www.qsr.mlit.go.jp/" },
    { id: "okinawa", name: "沖縄総合事務局", url: "https://www.ogb.go.jp/" },
    { id: "other", name: "その他の発注機関", url: "" }
  ],
  additionalCostCategories: [
    { id: "market", name: "市場単価" },
    { id: "material", name: "材料" },
    { id: "machine", name: "機械・損料" },
    { id: "transport", name: "運搬" },
    { id: "temporary", name: "仮設" },
    { id: "travel", name: "旅費交通費" },
    { id: "inspection", name: "成果検定・試験" },
    { id: "quote", name: "個別見積" },
    { id: "other", name: "その他" }
  ],
  costBuckets: [
    { id: "designDirectExpenses", name: "設計等・積上直接経費" },
    { id: "surveyPlanningDirectExpenses", name: "調査計画（測量方式）・直接経費" },
    { id: "geologyDirectNonLabor", name: "地質一般・直接調査費（人件費以外）" },
    { id: "geologyIndirect", name: "地質一般・間接調査費" },
    { id: "geologyExcluded", name: "地質一般・諸経費対象外" }
  ]
};
