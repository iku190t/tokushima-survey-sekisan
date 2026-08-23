from __future__ import annotations

import hashlib
import json
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/official-source-catalog.json"
CATALOG_JS = ROOT / "data/official-source-catalog.js"
PDF_DIR = ROOT / "tmp/pdfs/mlit"

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


def main() -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    existing = {entry["id"]: entry for entry in data.get("sources", [])}
    for year, meta in YEARS.items():
        existing.pop(f"mlit-{meta['prefix']}-measurement", None)
        for (slug, title, kind), content_id in zip(DOCS, meta["ids"]):
            path = PDF_DIR / f"{meta['prefix']}-{slug}.pdf"
            source_id = f"mlit-{meta['prefix']}-measurement-standard" if slug == "measurement" else f"mlit-{meta['prefix']}-{slug}"
            existing[source_id] = {
                "id": source_id,
                "jurisdictionCode": "mlit",
                "jurisdictionName": "国土交通省（直轄）",
                "fiscalYear": year,
                "kind": kind,
                "title": f"{meta['era']} {title}",
                "url": f"https://www.mlit.go.jp/tec/content/{content_id}.pdf",
                "pages": len(PdfReader(str(path)).pages),
                "bytes": path.stat().st_size,
                "sha256": digest(path),
                "acquisitionStatus": "acquired",
                "auditStatus": "indexed",
            }
    data["auditedAt"] = "2026-08-23"
    data["policy"] = "公式公開元、年度、SHA-256、ページ数を確認できた原資料だけを記録する。取得・索引済みは全表の計算実装済みを意味しない。"
    data["sources"] = sorted(existing.values(), key=lambda row: (str(row.get("jurisdictionCode")), int(row.get("fiscalYear", 0)), str(row.get("kind"))))
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    CATALOG_JS.write_text("window.OFFICIAL_SOURCE_CATALOG = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({"sourceCount": len(data["sources"]), "mlitR6R8": sum(1 for row in data["sources"] if row["id"].startswith("mlit-r") and row.get("fiscalYear") in YEARS)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
