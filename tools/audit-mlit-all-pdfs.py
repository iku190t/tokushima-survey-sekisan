from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
from datetime import date
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
INDEX_URL = "https://www.mlit.go.jp/tec/gyoumu_sekisan.html"
PDF_DIR = ROOT / "tmp/pdfs/mlit-all"
OUTPUT = ROOT / "data/source-audits/mlit-gyoumu-sekisan-documents.json"


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[dict[str, str]] = []
        self.href = ""
        self.text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "a":
            self.href = dict(attrs).get("href") or ""
            self.text = []

    def handle_data(self, data: str) -> None:
        if self.href:
            self.text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a" or not self.href:
            return
        url = urljoin(INDEX_URL, self.href)
        if url.lower().split("?", 1)[0].endswith(".pdf"):
            self.links.append({"label": " ".join("".join(self.text).split()), "url": url})
        self.href = ""
        self.text = []


def fetch(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 Codex source audit"})
    with urlopen(request, timeout=60) as response:
        return response.read()


def inspect_pdf(url: str, labels: list[str]) -> dict[str, object]:
    filename = Path(urlparse(url).path).name
    target = PDF_DIR / filename
    try:
        raw = fetch(url)
        target.write_bytes(raw)
        reader = PdfReader(str(target))
        return {
            "url": url,
            "labels": labels,
            "status": "acquired",
            "bytes": len(raw),
            "pages": len(reader.pages),
            "sha256": hashlib.sha256(raw).hexdigest(),
        }
    except Exception as exc:  # network/PDF failures must remain visible in the audit
        return {"url": url, "labels": labels, "status": "failed", "error": f"{type(exc).__name__}: {exc}"}


def main() -> None:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    parser = LinkParser()
    parser.feed(fetch(INDEX_URL).decode("utf-8", errors="replace"))
    grouped: dict[str, list[str]] = {}
    for link in parser.links:
        labels = grouped.setdefault(link["url"], [])
        if link["label"] and link["label"] not in labels:
            labels.append(link["label"])

    documents: list[dict[str, object]] = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(inspect_pdf, url, labels): url for url, labels in grouped.items()}
        for index, future in enumerate(as_completed(futures), 1):
            documents.append(future.result())
            if index % 20 == 0 or index == len(futures):
                print(f"audited {index}/{len(futures)}", flush=True)

    documents.sort(key=lambda row: str(row["url"]))
    acquired = sum(row["status"] == "acquired" for row in documents)
    total_pages = sum(int(row.get("pages", 0)) for row in documents)
    total_bytes = sum(int(row.get("bytes", 0)) for row in documents)
    payload = {
        "sourcePage": INDEX_URL,
        "auditedAt": date.today().isoformat(),
        "pdfLinkCount": len(parser.links),
        "uniquePdfLinkCount": len(grouped),
        "acquiredCount": acquired,
        "failedCount": len(documents) - acquired,
        "totalPages": total_pages,
        "totalBytes": total_bytes,
        "scope": "全掲載PDFの取得可否・ページ数・容量・SHA-256監査。取得・索引済みは全表の計算実装済みを意味しない。",
        "documents": documents,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"unique": len(grouped), "acquired": acquired, "failed": len(documents) - acquired, "pages": total_pages, "bytes": total_bytes}, ensure_ascii=False))


if __name__ == "__main__":
    main()
