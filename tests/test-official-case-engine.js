"use strict";

const assert = require("assert");
const engine = require("../official-case-engine.js");

const xml = `<?xml version="1.0" encoding="utf-8"?>
<Results><Version>1.0</Version><SearchResults><SearchHits>2</SearchHits>
<SearchResult><Key><![CDATA[official-key-1]]></Key><ExternalDocumentURI><![CDATA[https://www.city.example.lg.jp/notice.pdf]]></ExternalDocumentURI><ProjectName>農林委2 令和8年度中央地区測量設計委託業務</ProjectName><Date>2026-05-22T10:00:00+09:00</Date><LgCode>36</LgCode><PrefectureName>徳島県</PrefectureName><OrganizationName>徳島県美馬市</OrganizationName><CftIssueDate>2026-05-21T00:00:00+09:00</CftIssueDate><PeriodEndTime>2027-03-15T00:00:00+09:00</PeriodEndTime><Category>役務</Category><ProcedureType>一般競争入札</ProcedureType><Location>徳島県美馬市</Location><ProjectDescription><![CDATA[業務番号 農林委2 中央地区の測量設計]]></ProjectDescription><Attachments><Attachment><Name>特記仕様書</Name><Uri><![CDATA[https://www.city.example.lg.jp/spec.pdf]]></Uri></Attachment><Attachment><Name>数量総括表</Name><Uri><![CDATA[https://www.city.example.lg.jp/quantity.pdf]]></Uri></Attachment><Attachment><Name>訂正版</Name><Uri><![CDATA[https://www.city.example.lg.jp/correction.pdf]]></Uri></Attachment></Attachments></SearchResult>
<SearchResult><Key>official-key-2</Key><ExternalDocumentURI>https://www.other.go.jp/unrelated.html</ExternalDocumentURI><ProjectName>庁舎清掃業務</ProjectName><Date>2026-04-10T00:00:00+09:00</Date><LgCode>13</LgCode><OrganizationName>別機関</OrganizationName><Category>役務</Category></SearchResult>
</SearchResults></Results>`;

const parsed = engine.parseKkjXml(xml);
assert.strictEqual(parsed.version, "1.0");
assert.strictEqual(parsed.searchHits, 2);
assert.strictEqual(parsed.results.length, 2);
assert.strictEqual(parsed.results[0].attachments.length, 3);
assert.strictEqual(parsed.results[0].attachments[1].title, "数量総括表");

const criteria = { projectName: "令和8年度 中央地区 測量設計委託業務", organizationName: "徳島県美馬市", documentNumber: "農林委2", fiscalYear: 2026, prefectureCode: "36", location: "徳島県美馬市" };
const ranked = engine.rankResults(criteria, parsed.results);
assert.strictEqual(ranked[0].key, "official-key-1", "番号・件名・機関・年度・地域の一致候補を最上位にする");
assert.ok(ranked[0].match.score >= 75, "複数識別子が一致する案件を高一致にする");
assert.strictEqual(ranked[0].match.level, "high");
assert.ok(ranked[1].match.score < ranked[0].match.score, "無関係案件の一致度を下げる");

const apiUrl = new URL(engine.buildKkjApiUrl(criteria));
assert.strictEqual(apiUrl.origin + apiUrl.pathname, "https://www.kkj.go.jp/api/");
assert.strictEqual(apiUrl.searchParams.get("Project_Name"), criteria.projectName);
assert.strictEqual(apiUrl.searchParams.get("Organization_Name"), criteria.organizationName);
assert.strictEqual(apiUrl.searchParams.get("LG_Code"), "36");
assert.strictEqual(apiUrl.searchParams.get("Category"), "3");
assert.strictEqual(apiUrl.searchParams.get("CFT_Issue_Date"), "2026-04-01/2027-03-31");

const portalUrl = new URL(engine.buildKkjPortalUrl(criteria));
assert.strictEqual(portalUrl.origin + portalUrl.pathname, "https://www.kkj.go.jp/s/");
assert.strictEqual(portalUrl.searchParams.get("ti"), criteria.projectName);
assert.strictEqual(portalUrl.searchParams.get("on"), criteria.organizationName);

assert.strictEqual(engine.sourceType("特記仕様書"), "specification");
assert.strictEqual(engine.sourceType("数量総括表"), "quantity");
assert.strictEqual(engine.sourceType("質問回答書"), "qa");
assert.strictEqual(engine.sourceType("訂正・差替え資料"), "correction");
const sources = engine.recordSources(ranked[0]);
assert.strictEqual(sources.length, 4, "公告URLと添付資料を台帳候補にする");
assert.ok(sources.every((source) => source.status === "review"), "公式検索結果も確認前は要確認とする");
assert.ok(sources.some((source) => source.documentType === "correction"), "訂正版を区別する");
assert.ok(engine.isLikelyGovernmentUrl("https://www.kkj.go.jp/s/"));
assert.ok(engine.isLikelyGovernmentUrl("https://www.example.go.jp/a.pdf"));
assert.ok(engine.isLikelyGovernmentUrl("https://www.city.example.lg.jp/a.pdf"));
assert.ok(!engine.isLikelyGovernmentUrl("https://example.com/a.pdf"));
assert.ok(engine.isSafeWebUrl("https://www.example.go.jp/a.pdf"));
assert.ok(!engine.isSafeWebUrl("javascript:alert(1)"));
const unsafeRecord = { ...ranked[0], externalUrl: "javascript:alert(1)", attachments: [{ title: "仕様書", url: "data:text/html,bad" }] };
assert.deepStrictEqual(engine.recordSources(unsafeRecord), [], "危険なURLスキームは台帳候補にしない");

assert.throws(() => engine.parseKkjXml("<Results><Error>search disabled</Error></Results>"), /公式検索APIエラー/);

console.log("OK: official procurement case matching, XML parsing, and source ledger candidates passed");
