from __future__ import annotations

import hashlib
from datetime import date
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/official-source-catalog.json"
CATALOG_JS = ROOT / "data/official-source-catalog.js"
PDF_DIR = ROOT / "tmp/pdfs/mlit-all"
LINK_AUDIT = ROOT / "data/source-audits/mlit-gyoumu-sekisan-links.json"
INDEX_URL = "https://www.mlit.go.jp/tec/gyoumu_sekisan.html"

BASE_DOCS = [
    ("mlit-h23-toc", 2011, "base-toc", "平成23年度 標準積算基準書 総目次", "https://www.mlit.go.jp/common/001068102.pdf", "h23-toc.pdf"),
    ("mlit-h23-measurement", 2011, "base-measurement-standard", "平成23年度 標準積算基準書 第1編 測量業務", "https://www.mlit.go.jp/common/001068098.pdf", "h23-measurement.pdf"),
    ("mlit-h23-geology", 2011, "base-geology-standard", "平成23年度 標準積算基準書 第2編 地質調査業務", "https://www.mlit.go.jp/common/001068099.pdf", "h23-geology.pdf"),
    ("mlit-h23-design", 2011, "base-design-standard", "平成23年度 標準積算基準書 第3編 設計業務等", "https://www.mlit.go.jp/common/001068100.pdf", "h23-design.pdf"),
    ("mlit-h23-planning", 2011, "base-planning-standard", "平成23年度 標準積算基準書 第4編 調査・計画業務", "https://www.mlit.go.jp/common/001068101.pdf", "h23-planning.pdf"),
    ("mlit-h23-reference-toc", 2011, "base-reference-toc", "平成23年度 参考資料 目次", "https://www.mlit.go.jp/common/001068095.pdf", "h23-reference-toc.pdf"),
    ("mlit-h23-reference-general", 2011, "base-reference-general", "平成23年度 参考資料 第1編 総則", "https://www.mlit.go.jp/common/001068091.pdf", "h23-reference-general.pdf"),
    ("mlit-h23-reference-measurement", 2011, "base-reference-measurement", "平成23年度 参考資料 第2編 測量業務", "https://www.mlit.go.jp/common/001068092.pdf", "h23-reference-measurement.pdf"),
    ("mlit-h23-reference-geology", 2011, "base-reference-geology", "平成23年度 参考資料 第3編 地質調査業務", "https://www.mlit.go.jp/common/001068093.pdf", "h23-reference-geology.pdf"),
    ("mlit-h23-reference-design", 2011, "base-reference-design", "平成23年度 参考資料 第4編 設計業務等", "https://www.mlit.go.jp/common/001068094.pdf", "h23-reference-design.pdf"),
    ("mlit-h26-reference-amendment", 2014, "reference-amendment-general", "平成26年度 参考資料改正内容（数値・端数処理を含む）", "https://www.mlit.go.jp/common/001082359.pdf", "h26-reference-amendment.pdf"),
]

YEARS = {
    2024: {
        "era": "令和6年度",
        "ids": ["001984386", "001984387", "001984388", "001984389", "001984390", "001984391", "001984392", "001984393"],
        "prefix": "r6",
    },
    2025: {
        "era": "令和7年度",
        "ids": ["001984378", "001984379", "001984380", "001984381", "001984382", "001984383", "001984384", "001984385"],
        "prefix": "r7",
    },
    2026: {
        "era": "令和8年度",
        "ids": ["001867424", "001867425", "001867426", "001867427", "001867428", "001867429", "001989908", "001867431"],
        "prefix": "r8",
    },
}

DOCS = [
    ("measurement", "測量業務積算基準", "measurement-standard"),
    ("geology", "地質調査積算基準", "geology-standard"),
    ("design", "土木設計業務等積算基準", "design-standard"),
    ("amend-1", "標準積算基準書 改定内容（1）", "standard-amendment-1"),
    ("amend-2", "標準積算基準書 改定内容（2）", "standard-amendment-2"),
    ("amend-3", "標準積算基準書 改定内容（3）", "standard-amendment-3"),
    ("amend-4", "標準積算基準書 改定内容（4）", "standard-amendment-4"),
    ("reference", "参考資料 改定内容", "reference-amendment"),
]


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[dict[str, str]] = []
        self.current_href = ""
        self.current_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        self.current_href = dict(attrs).get("href") or ""
        self.current_text = []

    def handle_data(self, data: str) -> None:
        if self.current_href:
            self.current_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a" or not self.current_href:
            return
        url = urljoin(INDEX_URL, self.current_href)
        label = " ".join("".join(self.current_text).split())
        self.links.append({"label": label, "url": url})
        self.current_href = ""
        self.current_text = []


def update_link_audit() -> None:
    request = Request(INDEX_URL, headers={"User-Agent": "Mozilla/5.0 Codex source audit"})
    with urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8", errors="replace")
    parser = LinkParser()
    parser.feed(html)
    pdf_links = [link for link in parser.links if link["url"].lower().split("?", 1)[0].endswith(".pdf")]
    unique: dict[str, dict[str, object]] = {}
    for link in pdf_links:
        row = unique.setdefault(link["url"], {"url": link["url"], "labels": [], "occurrences": 0})
        row["occurrences"] = int(row["occurrences"]) + 1
        if link["label"] and link["label"] not in row["labels"]:
            row["labels"].append(link["label"])
    payload = {
        "sourcePage": INDEX_URL,
        "auditedAt": date.today().isoformat(),
        "allLinkCount": len(parser.links),
        "pdfLinkCount": len(pdf_links),
        "uniquePdfLinkCount": len(unique),
        "scope": "掲載リンクの存在目録。各PDFの全計算表実装済みを意味しない。",
        "pdfLinks": list(unique.values()),
    }
    LINK_AUDIT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    update_link_audit()
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    existing = {entry["id"]: entry for entry in data.get("sources", [])}
    for source_id, year, kind, title, url, filename in BASE_DOCS:
        path = PDF_DIR / Path(urlparse(url).path).name
        existing[source_id] = {
            "id": source_id,
            "jurisdictionCode": "mlit",
            "jurisdictionName": "国土交通省（直轄）",
            "fiscalYear": year,
            "kind": kind,
            "title": title,
            "url": url,
            "pages": len(PdfReader(str(path)).pages),
            "bytes": path.stat().st_size,
            "sha256": digest(path),
            "acquisitionStatus": "acquired",
            "auditStatus": "indexed",
        }
    for year, meta in YEARS.items():
        existing.pop(f"mlit-{meta['prefix']}-measurement", None)
        for (slug, title, kind), content_id in zip(DOCS, meta["ids"]):
            url = f"https://www.mlit.go.jp/tec/content/{content_id}.pdf"
            path = PDF_DIR / Path(urlparse(url).path).name
            source_id = f"mlit-{meta['prefix']}-measurement-standard" if slug == "measurement" else f"mlit-{meta['prefix']}-{slug}"
            existing[source_id] = {
                "id": source_id,
                "jurisdictionCode": "mlit",
                "jurisdictionName": "国土交通省（直轄）",
                "fiscalYear": year,
                "kind": kind,
                "title": f"{meta['era']} {title}",
                "url": url,
                "pages": len(PdfReader(str(path)).pages),
                "bytes": path.stat().st_size,
                "sha256": digest(path),
                "acquisitionStatus": "acquired",
                "auditStatus": "indexed",
            }
    data["auditedAt"] = date.today().isoformat()
    data["policy"] = "公式公開元、年度、SHA-256、ページ数を確認できた原資料だけを記録する。取得・索引済みは全表の計算実装済みを意味しない。"
    data["sources"] = sorted(existing.values(), key=lambda row: (str(row.get("jurisdictionCode")), int(row.get("fiscalYear", 0)), str(row.get("kind"))))
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    CATALOG_JS.write_text("window.OFFICIAL_SOURCE_CATALOG = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({
        "sourceCount": len(data["sources"]),
        "mlitBase": len(BASE_DOCS),
        "mlitR6R8": sum(1 for row in data["sources"] if row["id"].startswith("mlit-r") and row.get("fiscalYear") in YEARS),
        "linkAudit": str(LINK_AUDIT.relative_to(ROOT)),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
