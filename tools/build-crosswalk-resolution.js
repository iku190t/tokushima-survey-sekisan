"use strict";

const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "data", "source-audits", "consulting-fullbook-crosswalk.json");
const outputPath = path.join(root, "data", "source-audits", "consulting-crosswalk-resolution.json");
const crosswalk = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

function headings(page) {
  return (page.headings || []).map((entry) => typeof entry === "string" ? entry : entry.title || "").filter(Boolean).join(" / ");
}

function resolution(page) {
  const title = headings(page);
  if (!page.tableCount) return {
    classification: "no-calculation-table",
    resolutionStatus: "reviewed-excluded",
    calculationEnabled: false,
    reason: "表抽出なし（目次・扉・説明本文等）。数量式・歩掛・補正の自動計算根拠には使用しない。"
  };
  if (title.includes("雪崩予防施設")) return {
    classification: "official-amendment-family-located",
    resolutionStatus: "official-reference-confirmed-excluded",
    calculationEnabled: false,
    officialReference: "https://www.mlit.go.jp/common/001082831.pdf",
    reason: "国土交通省の雪崩予防施設改定資料を確認。統合版ページとの表単位対応が低確度のため、個別式の実装確認が完了するまでは計算対象外。"
  };
  if (title.includes("橋梁詳細設計")) return {
    classification: "official-amendment-family-located",
    resolutionStatus: "official-reference-confirmed-excluded",
    calculationEnabled: false,
    officialReference: "https://www.mlit.go.jp/common/001279051.pdf",
    reason: "国土交通省の橋梁詳細設計改定資料を確認。統合版ページとの表単位対応が低確度のため、個別式の実装確認が完了するまでは計算対象外。"
  };
  if (title.includes("流量観測")) return {
    classification: "official-formula-family-located",
    resolutionStatus: "official-reference-confirmed-excluded",
    calculationEnabled: false,
    officialReference: "https://www.mlit.go.jp/common/001234723.pdf",
    reason: "国土交通省資料の流量観測式を確認。該当年度統合版の全条件・職種配分との対応が低確度のため、個別式の実装確認が完了するまでは計算対象外。"
  };
  return {
    classification: "unresolved-calculation-table",
    resolutionStatus: "reviewed-blocked",
    calculationEnabled: false,
    reason: "表は存在するが国土交通省本省の有効ページへ一意に対応できないため、自動計算・選択候補から除外。"
  };
}

const pages = [];
for (const book of crosswalk.books || []) {
  for (const page of book.pages || []) {
    if (!["low", "unmatched"].includes(page.matchConfidence)) continue;
    pages.push({
      fiscalYear: book.fiscalYear,
      physicalPage: page.physicalPage,
      printedPage: page.printedPage,
      serviceType: page.serviceType,
      headings: headings(page),
      tableCount: page.tableCount,
      originalConfidence: page.matchConfidence,
      ...resolution(page)
    });
  }
}

const output = {
  schemaVersion: 1,
  auditedAt: "2026-08-24",
  source: "data/source-audits/consulting-fullbook-crosswalk.json",
  policy: "低確度・未照合ページは全件個別台帳化し、国土交通省本省の対応資料を確認できても表単位の実装検証が完了するまでは計算に使用しない。",
  summary: {
    reviewedPages: pages.length,
    calculationEnabledPages: pages.filter((page) => page.calculationEnabled).length,
    excludedPages: pages.filter((page) => !page.calculationEnabled).length,
    noTablePages: pages.filter((page) => page.tableCount === 0).length,
    tablePages: pages.filter((page) => page.tableCount > 0).length,
    officialFamilyLocatedPages: pages.filter((page) => page.resolutionStatus === "official-reference-confirmed-excluded").length,
    blockedTablePages: pages.filter((page) => page.resolutionStatus === "reviewed-blocked").length
  },
  pages
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(JSON.stringify(output.summary));
