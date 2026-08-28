from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import urllib.request

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "tmp" / "pdfs" / "maff-land-improvement"
OUTPUT_JSON = ROOT / "data" / "source-audits" / "maff-land-improvement-sources.json"
OUTPUT_JS = ROOT / "data" / "maff-source-catalog.js"

MAIN_PAGE = "https://www.maff.go.jp/j/nousin/sekkei/sekisan_kijun/index.html"
R7_PAGE = "https://www.maff.go.jp/j/nousin/sekkei/sekisan_kijun/sekisan_kijun_old/sekisan_kijun_R7.html"
R6_PAGE = "https://www.maff.go.jp/j/nousin/sekkei/sekisan_kijun/sekisan_kijun_old/sekisan_kijun_r6.html"

DOCS = [
    ("cover", "表紙・目次", "reference"),
    ("investigation", "1．調査", "calculation"),
    ("survey", "2．測量", "calculation"),
    ("design", "3．設計", "calculation"),
    ("business-materials", "4．業務関係資料", "calculation"),
    ("reference-walk", "5．積算参考歩掛", "reference-walk"),
    ("notes", "6．留意事項", "condition"),
    ("management-guide", "7．設計業務管理の手引書", "reference"),
    ("role-prices", "8．技術者基準日額", "rate"),
    ("survey-machinery", "9．測量機械等損料", "rate"),
    ("contact", "10．問合せ先", "reference"),
]


def sources() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for offset, (doc_id, title, usage) in enumerate(DOCS, 302):
        rows.append({
            "id": f"maff-2026-{doc_id}", "fiscalYear": 2026, "docId": doc_id,
            "title": title, "usage": usage, "pageUrl": MAIN_PAGE,
            "url": f"https://www.maff.go.jp/j/nousin/sekkei/sekisan_kijun/attach/pdf/index-{offset}.pdf",
        })
    old_docs = [
        *DOCS[:5],
        ("reference-walk-1", "5-1．積算参考歩掛", "reference-walk"),
        ("reference-walk-2", "5-2．積算参考歩掛", "reference-walk"),
        ("reference-walk-3", "5-3．積算参考歩掛", "reference-walk"),
        *DOCS[6:],
    ]
    for year, page_url, prefix in ((2025, R7_PAGE, "R7"), (2024, R6_PAGE, "r6")):
        for number, (doc_id, title, usage) in enumerate(old_docs, 21):
            rows.append({
                "id": f"maff-{year}-{doc_id}", "fiscalYear": year, "docId": doc_id,
                "title": title, "usage": usage, "pageUrl": page_url,
                "url": f"https://www.maff.go.jp/j/nousin/sekkei/sekisan_kijun/sekisan_kijun_old/attach/pdf/sekisan_kijun_{prefix}-{number}.pdf",
            })
    return rows


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def clean_line(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def page_headings(text: str) -> list[str]:
    found: list[str] = []
    for raw in text.splitlines():
        line = clean_line(raw)
        if not 2 <= len(line) <= 100:
            continue
        if re.match(r"^(?:第\s*\d+|\d+(?:[-－]\d+){0,4}|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨ])(?:\s|[．.])", line):
            if line not in found:
                found.append(line)
    return found[:20]


def signals(text: str) -> list[str]:
    checks = {
        "price-formula": ("業務費", "積算方式", "価格の積算"),
        "standard-walk": ("標準歩掛", "標準作業量", "延人日数"),
        "condition": ("適用範囲", "適用条件", "留意事項"),
        "correction": ("補正係数", "補正式", "割増", "割引"),
        "quantity-formula": ("算定式", "数量算定", "日当たり作業量"),
        "market-unit-price": ("市場単価", "設計単価"),
        "role-rate": ("基準日額", "技術者単価"),
        "machinery-rate": ("機械損料", "損料額"),
        "rounding": ("端数", "四捨五入", "切り捨て", "切捨て"),
        "expense-rate": ("諸経費率", "一般管理費等", "その他原価"),
        "reference-only": ("積算参考歩掛", "参考資料"),
    }
    return [key for key, terms in checks.items() if any(term in text for term in terms)]


def download(row: dict[str, object], refresh: bool) -> Path:
    year_dir = CACHE / str(row["fiscalYear"])
    year_dir.mkdir(parents=True, exist_ok=True)
    path = year_dir / f'{row["docId"]}.pdf'
    if refresh or not path.exists():
        request = urllib.request.Request(str(row["url"]), headers={"User-Agent": "Mozilla/5.0 web-sekisan-source-audit"})
        with urllib.request.urlopen(request, timeout=90) as response:
            data = response.read()
        if not data.startswith(b"%PDF"):
            raise RuntimeError(f'PDFではありません: {row["url"]}')
        path.write_bytes(data)
    return path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    inventory: list[dict[str, object]] = []
    all_page_count = 0
    for index, row in enumerate(sources(), 1):
        path = download(row, args.refresh)
        data = path.read_bytes()
        reader = PdfReader(str(path))
        pages: list[dict[str, object]] = []
        for page_number, page in enumerate(reader.pages, 1):
            text = page.extract_text() or ""
            pages.append({
                "page": page_number,
                "textSha256": sha256_text(text),
                "headings": page_headings(text),
                "signals": signals(text),
            })
        all_page_count += len(pages)
        inventory.append({
            **row,
            "filename": path.name,
            "bytes": len(data),
            "sha256": sha256_bytes(data),
            "pageCount": len(pages),
            "pages": pages,
        })
        print(f'[{index:02d}/{len(sources()):02d}] R{int(row["fiscalYear"]) - 2018} {row["title"]}: {len(pages)} pages', flush=True)

    payload = {
        "schemaVersion": 1,
        "auditedAt": "2026-08-28",
        "authority": "農林水産省",
        "systemId": "maff-land-improvement",
        "scope": "土地改良工事積算基準（調査・測量・設計）令和6～8年度の農林水産省公開資料",
        "supportedYears": [2026, 2025, 2024],
        "documentCount": len(inventory),
        "pageCount": all_page_count,
        "documents": inventory,
    }
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    json_text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    OUTPUT_JSON.write_text(json_text, encoding="utf-8")
    OUTPUT_JS.write_text("window.MAFF_SOURCE_CATALOG = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({"documents": len(inventory), "pages": all_page_count, "output": str(OUTPUT_JSON.relative_to(ROOT))}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
