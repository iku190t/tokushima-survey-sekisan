from __future__ import annotations

import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
INDEX_URL = "https://www.mlit.go.jp/tec/gyoumu_sekisan.html"
PDF_DIR = ROOT / "tmp/pdfs/mlit-all"
OUTPUT = ROOT / "data/source-audits/mlit-effective-rule-pages.json"

ERA_YEAR = re.compile(r"(平成|令和)\s*([0-9０-９]+)\s*年度")
HEADING = re.compile(
    r"^(?:第\s*[0-9０-９一二三四五六七八九十]+\s*[編章節]|"
    r"[0-9０-９]+(?:\s*[－ー-]\s*[0-9０-９]+){0,3}\s+|"
    r"(?:表|図)\s*[0-9０-９]+(?:[.．－ー-][0-9０-９]+)*)"
)
RULE_SIGNALS = {
    "standard-walk": re.compile(r"標準歩掛"),
    "correction": re.compile(r"補正|割増|割引|加算|控除"),
    "applicability": re.compile(r"適用範囲|適用する|適用しない|対象とする|対象外"),
    "formula": re.compile(r"算定式|計算式|変化率|補正係数|算出式"),
    "quantity": re.compile(r"数量算出|設計数量|標準数量|作業量"),
    "market-unit": re.compile(r"市場単価|規格区分"),
    "crew": re.compile(r"編成人員|編成人肩|職種別人員"),
    "rounding": re.compile(r"端数処理|四捨五入|切り捨て|切捨て|小数第"),
    "note": re.compile(r"注[）)]|注\s*[：:]|備考"),
}


def era_to_year(era: str, value: str) -> int:
    number = int(value.translate(str.maketrans("０１２３４５６７８９", "0123456789")))
    return (1988 if era == "平成" else 2018) + number


class ContextLinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[dict[str, object]] = []
        self.edition: int | None = None
        self.fiscal_year: int | None = None
        self.in_h3 = False
        self.h3_text: list[str] = []
        self.href = ""
        self.link_text: list[str] = []

    def _accept_context(self, text: str) -> None:
        for match in ERA_YEAR.finditer(text):
            year = era_to_year(match.group(1), match.group(2))
            self.fiscal_year = year
            if self.in_h3:
                self.edition = year

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag == "h3":
            self.in_h3 = True
            self.h3_text = []
        if tag == "a":
            self.href = dict(attrs).get("href") or ""
            self.link_text = []

    def handle_data(self, data: str) -> None:
        self._accept_context(data)
        if self.in_h3:
            self.h3_text.append(data)
        if self.href:
            self.link_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "h3":
            self._accept_context("".join(self.h3_text))
            self.in_h3 = False
        if tag != "a" or not self.href:
            return
        url = urljoin(INDEX_URL, self.href)
        if url.lower().split("?", 1)[0].endswith(".pdf"):
            self.links.append({
                "url": url,
                "label": " ".join("".join(self.link_text).split()),
                "edition": self.edition,
                "fiscalYear": self.fiscal_year,
            })
        self.href = ""
        self.link_text = []


def fetch_index() -> str:
    request = Request(INDEX_URL, headers={"User-Agent": "Mozilla/5.0 Codex effective-rule audit"})
    with urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8", errors="replace")


def normalize_line(value: str) -> str:
    return " ".join(value.replace("\u3000", " ").split())


def page_record(document: dict[str, object], page_number: int, text: str) -> dict[str, object]:
    normalized = "\n".join(filter(None, (normalize_line(line) for line in text.splitlines())))
    lines = normalized.splitlines()
    headings = [line[:160] for line in lines if HEADING.match(line)][:8]
    signals = [name for name, pattern in RULE_SIGNALS.items() if pattern.search(normalized)]
    signal_lines = [
        line[:220] for line in lines
        if any(pattern.search(line) for pattern in RULE_SIGNALS.values())
    ][:8]
    return {
        "page": page_number,
        "textSha256": hashlib.sha256(normalized.encode("utf-8")).hexdigest(),
        "textLength": len(normalized),
        "headings": headings,
        "ruleSignals": signals,
        "signalLines": signal_lines,
    }


def main() -> None:
    parser = ContextLinkParser()
    parser.feed(fetch_index())

    # The current system is the FY2011 base edition plus every published amendment
    # in that edition. The FY2002 edition below it on the page is retained only as history.
    grouped: dict[str, dict[str, object]] = {}
    for link in parser.links:
        if link["edition"] != 2011 or int(link.get("fiscalYear") or 0) < 2011:
            continue
        row = grouped.setdefault(link["url"], {
            "url": link["url"],
            "edition": 2011,
            "fiscalYear": link["fiscalYear"],
            "labels": [],
        })
        if link["label"] and link["label"] not in row["labels"]:
            row["labels"].append(link["label"])

    documents: list[dict[str, object]] = []
    signal_totals = {name: 0 for name in RULE_SIGNALS}
    total_pages = 0
    for index, document in enumerate(grouped.values(), 1):
        filename = Path(urlparse(str(document["url"])).path).name
        path = PDF_DIR / filename
        if not path.exists():
            raise FileNotFoundError(f"official PDF is not cached: {path}")
        reader = PdfReader(str(path))
        pages = []
        for page_number, page in enumerate(reader.pages, 1):
            record = page_record(document, page_number, page.extract_text() or "")
            pages.append(record)
            for signal in record["ruleSignals"]:
                signal_totals[signal] += 1
        total_pages += len(pages)
        documents.append({
            **document,
            "filename": filename,
            "pages": len(pages),
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "pageIndex": pages,
        })
        if index % 20 == 0 or index == len(grouped):
            print(f"indexed {index}/{len(grouped)}", flush=True)

    documents.sort(key=lambda row: (int(row["fiscalYear"]), str(row["url"])))
    payload = {
        "sourcePage": INDEX_URL,
        "auditedAt": "2026-08-24",
        "effectiveEdition": 2011,
        "effectiveThroughFiscalYear": max(int(row["fiscalYear"]) for row in documents),
        "documentCount": len(documents),
        "pageCount": total_pages,
        "ruleSignalPageCounts": signal_totals,
        "scope": "平成23年度版の基準書・参考資料と、同版に対して令和8年度まで掲載された累積改定のページ監査。見出し・規則語・ページ本文ハッシュの索引であり、計算実装済みを意味しない。",
        "excludedHistoricalEdition": 2002,
        "documents": documents,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "documents": len(documents),
        "pages": total_pages,
        "through": payload["effectiveThroughFiscalYear"],
        "signals": signal_totals,
        "output": str(OUTPUT.relative_to(ROOT)),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
