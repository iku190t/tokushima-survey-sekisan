from __future__ import annotations

from collections import Counter
from difflib import SequenceMatcher
import hashlib
import json
from pathlib import Path
import re
import unicodedata

import pdfplumber
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "data/source-audits/mlit-effective-rule-pages.json"
OFFICIAL_PDF_DIR = ROOT / "tmp/pdfs/mlit-all"
FULLBOOK_DIR = ROOT / "tmp/consulting-fullbooks"
OUTPUT = ROOT / "data/source-audits/consulting-fullbook-crosswalk.json"

FULLBOOKS = {
    2024: FULLBOOK_DIR / "r6-standard.pdf",
    2025: FULLBOOK_DIR / "r7-standard.pdf",
    2026: FULLBOOK_DIR / "r8-standard.pdf",
}

SPACE = re.compile(r"\s+")
NOISE = re.compile(r"[\s\u3000・･、,，.．:：;；/／()（）\[\]［］【】「」『』<>＜＞=＝\-－ー_\u00a0]")
HEADING = re.compile(r"^(\d+(?:-\d+){1,3})\s+(.{2,80})$")
PAGE_FOOTER = re.compile(r"[-－]\s*(\d+)\s*[-－]")


def norm(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    return NOISE.sub("", value).lower()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def service_type(text: str, printed_page: int) -> str | None:
    compact = SPACE.sub("", text)
    if "第2編地質調査業務" in compact:
        return "geology"
    if "第3編土木設計業務" in compact:
        return "design"
    if "第4編調査・計画業務" in compact or "第4編調査、計画業務" in compact:
        return "planning"
    if 89 <= printed_page <= 132:
        return "geology"
    if 133 <= printed_page <= 284:
        return "design"
    if printed_page >= 285:
        return "planning"
    return None


def headings(text: str) -> list[dict[str, str]]:
    found: list[dict[str, str]] = []
    for raw in text.splitlines():
        line = SPACE.sub(" ", raw).strip()
        match = HEADING.match(line)
        if not match or "---" in line or "…" in line:
            continue
        title = match.group(2).strip()
        if not title or title.startswith(("適用に", "（注）", "注）")):
            continue
        row = {"code": match.group(1), "title": title}
        if row not in found:
            found.append(row)
    return found[:12]


def page_score(full: dict[str, object], official: dict[str, object]) -> float:
    full_text = str(full["normalized"])
    official_text = str(official["normalized"])
    if not full_text or not official_text:
        return 0.0
    score = 0.0
    title_hits = 0
    for heading in full["headings"]:
        title = norm(str(heading["title"]))
        if len(title) >= 4 and title in official_text:
            score += min(35.0, 10.0 + len(title) / 2)
            title_hits += 1
    full_numbers = set(re.findall(r"\d+(?:\.\d+)?", full_text)) - {"0", "1", "2", "3", "4", "5", "10", "100"}
    official_numbers = set(re.findall(r"\d+(?:\.\d+)?", official_text)) - {"0", "1", "2", "3", "4", "5", "10", "100"}
    number_hits = full_numbers & official_numbers
    if not title_hits and len(number_hits) < 4:
        return 0.0
    score += min(55.0, len(number_hits) * 3.5)
    # Exact copied passages distinguish a real replacement page from a TOC hit.
    sample = full_text[:12000]
    ratio = SequenceMatcher(None, sample, official_text[:24000], autojunk=False).ratio()
    score += ratio * 100
    common = sum((Counter(sample[i:i + 8] for i in range(0, max(0, len(sample) - 7), 8)) &
                  Counter(official_text[i:i + 8] for i in range(0, max(0, len(official_text) - 7), 8))).values())
    score += min(40.0, common / 2)
    if official["fiscalYear"] == full["fiscalYear"]:
        score += 3
    return round(score, 3)


def main() -> None:
    inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
    official_pages: list[dict[str, object]] = []
    for document_index, document in enumerate(inventory["documents"], 1):
        reader = PdfReader(str(OFFICIAL_PDF_DIR / document["filename"]))
        indexed = {entry["page"]: entry for entry in document["pageIndex"]}
        for page_number, page in enumerate(reader.pages, 1):
            text = page.extract_text() or ""
            official_pages.append({
                "fiscalYear": document["fiscalYear"],
                "edition": document["edition"],
                "filename": document["filename"],
                "url": document["url"],
                "labels": document["labels"],
                "page": page_number,
                "headings": indexed[page_number]["headings"],
                "ruleSignals": indexed[page_number]["ruleSignals"],
                "normalized": norm(text),
            })
        if document_index % 20 == 0 or document_index == len(inventory["documents"]):
            print(f"loaded official {document_index}/{len(inventory['documents'])}", flush=True)

    books: list[dict[str, object]] = []
    total_pages = 0
    matched_pages = 0
    for fiscal_year, path in FULLBOOKS.items():
        rows: list[dict[str, object]] = []
        with pdfplumber.open(path) as pdf:
            for physical_page, page in enumerate(pdf.pages, 1):
                text = page.extract_text(layout=False) or ""
                footer = PAGE_FOOTER.findall(text)
                printed_page = int(footer[-1]) if footer else physical_page
                service = service_type(text, printed_page)
                if service not in {"geology", "design", "planning"}:
                    continue
                total_pages += 1
                full = {
                    "fiscalYear": fiscal_year,
                    "physicalPage": physical_page,
                    "printedPage": printed_page,
                    "serviceType": service,
                    "headings": headings(text),
                    "normalized": norm(text),
                }
                candidates = []
                for official in official_pages:
                    if int(official["fiscalYear"]) > fiscal_year:
                        continue
                    score = page_score(full, official)
                    if score < 16:
                        continue
                    candidates.append({key: value for key, value in official.items() if key != "normalized"} | {"score": score})
                candidates.sort(key=lambda item: (float(item["score"]), int(item["fiscalYear"])), reverse=True)
                top = candidates[:5]
                confidence = "high" if top and top[0]["score"] >= 75 else "medium" if top and top[0]["score"] >= 40 else "low" if top else "unmatched"
                if confidence in {"high", "medium"}:
                    matched_pages += 1
                rows.append({
                    "physicalPage": physical_page,
                    "printedPage": printed_page,
                    "serviceType": service,
                    "headings": full["headings"],
                    "tableCount": len(page.find_tables()),
                    "matchConfidence": confidence,
                    "sourceCandidates": top,
                })
                if len(rows) % 50 == 0:
                    print(f"matched R{fiscal_year - 2018} {len(rows)} pages", flush=True)
        books.append({
            "fiscalYear": fiscal_year,
            "sha256": sha256(path),
            "pageCount": len(rows),
            "matchCounts": dict(Counter(row["matchConfidence"] for row in rows)),
            "pages": rows,
        })

    payload = {
        "auditedAt": "2026-08-24",
        "scope": "地方公共団体公開の年度統合版は表配置の確認補助にのみ使用し、各ページを国土交通省本省の平成23年度本体・累積改定へ逆照合した候補台帳。候補一致だけで規則実装済みとはしない。",
        "officialInventory": str(INVENTORY.relative_to(ROOT)).replace("\\", "/"),
        "fullbookCount": len(books),
        "pageCount": total_pages,
        "matchedPageCount": matched_pages,
        "books": books,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "pageCount": total_pages,
        "matchedPageCount": matched_pages,
        "books": [{"year": book["fiscalYear"], "counts": book["matchCounts"]} for book in books],
        "output": str(OUTPUT.relative_to(ROOT)).replace("\\", "/"),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
