from __future__ import annotations

import hashlib
import json
import re
from collections import Counter
from decimal import Decimal
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    2024: {
        "path": ROOT / "tmp/pdfs/hiroshima/r6-standard.pdf",
        "label": "令和6年度 土木設計業務等標準積算基準書（広島県公開全編・国標準部分）",
        "url": "https://chotatsu.pref.hiroshima.lg.jp/estimate/file/20240801.pdf",
    },
    2025: {
        "path": ROOT / "tmp/pdfs/hiroshima/r7-standard.pdf",
        "label": "令和7年度 土木設計業務等標準積算基準書（広島県公開全編・国標準部分）",
        "url": "https://chotatsu.pref.hiroshima.lg.jp/estimate/file/20250801.pdf",
    },
    2026: {
        "path": ROOT / "tmp/pdfs/hiroshima/r8-standard.pdf",
        "label": "令和8年度 土木設計業務等標準積算基準書（広島県公開全編・国標準部分）",
        "url": "https://chotatsu.pref.hiroshima.lg.jp/estimate/index/20260801-01.pdf",
    },
}

ROLE_ALIASES = {
    "designPrincipal": ("主任技術者",),
    "designDirector": ("理事技師長", "技師長"),
    "designLead": ("主任技師",),
    "designEngineerA": ("技師（A）", "技師(A)", "技師A"),
    "designEngineerB": ("技師（B）", "技師(B)", "技師B"),
    "designEngineerC": ("技師（C）", "技師(C)", "技師C"),
    "designTechnician": ("技術員",),
    "geologyEngineer": ("地質調査技師",),
    "geologyChiefOperator": ("主任地質調査員",),
    "geologyOperator": ("地質調査員",),
}

CODE_HEADING = re.compile(r"^\s*(\d+(?:-\d+){1,3})\s+(.+?)\s*$")
SUB_HEADING = re.compile(r"^\s*[（(](\d+)[）)]\s*(.+?)\s*$")
NUMBER = re.compile(r"^-?\d+(?:\.\d+)?$")


def compact(value: object) -> str:
    return re.sub(r"[\s\n]+", "", str(value or "")).replace("･", "・")


def cell_number(value: object) -> Decimal | None:
    text = compact(value).replace(",", "")
    if not NUMBER.fullmatch(text):
        return None
    try:
        return Decimal(text)
    except Exception:
        return None


def printed_page(text: str, fallback: int) -> int:
    matches = re.findall(r"[-－]\s*(\d+)\s*[-－]", text)
    return int(matches[-1]) if matches else fallback


def service_type(text: str, page_no: int) -> str | None:
    if "第 2 編 地質調査業務" in text or "第2編 地質調査業務" in text:
        return "geology"
    if "第 3 編 土木設計業務" in text or "第3編 土木設計業務" in text:
        return "design"
    if "第 4 編 調査・計画業務" in text or "第4編 調査・計画業務" in text:
        return "planning"
    # The full books use stable printed-page boundaries even when a continuation
    # page has an abbreviated or erroneous running header.
    if 87 <= page_no <= 132:
        return "geology"
    if 133 <= page_no <= 284:
        return "design"
    if page_no >= 285:
        return "planning"
    return None


def source_heading(text: str, fallback: str) -> tuple[str, str]:
    code = ""
    title = fallback
    for raw in text.splitlines():
        line = raw.strip()
        match = CODE_HEADING.match(line)
        if not match or "---" in line or "…" in line:
            continue
        candidate = match.group(2).strip()
        if candidate and not candidate.startswith(("適用", "補正係数")):
            code, title = match.group(1), candidate
    return code, title


def source_variant(text: str) -> str:
    candidates: list[str] = []
    for raw in text.splitlines()[-18:]:
        line = raw.strip()
        numbered = re.match(r"^\d+\s*[)）]\s*(.+?)\s*$", line)
        if numbered and numbered.group(1).strip():
            candidates.append(numbered.group(1).strip())
            continue
        match = SUB_HEADING.match(line)
        if not match:
            continue
        value = match.group(2).strip()
        if value and value not in {"標準歩掛", "標準歩掛等"} and not value.startswith("注"):
            candidates.append(value)
    return candidates[-1] if candidates else ""


def standard_unit(text: str) -> str:
    candidates = re.findall(r"[（(]([^（）()\r\n]{1,40}?当り[^（）()\r\n]{0,20})[）)]", text)
    if not candidates:
        return "標準表1式"
    value = re.sub(r"\s+", "", candidates[-1]).replace("あたり", "当り")
    return value


def header_role_columns(table: list[list[object]]) -> tuple[dict[int, str], int]:
    if not table:
        return {}, 0
    width = max(len(row) for row in table)
    best: dict[int, str] = {}
    best_end = 0
    for end in range(1, min(8, len(table)) + 1):
        mapping: dict[int, str] = {}
        for col in range(width):
            text = compact("".join(str(table[row][col] or "") if col < len(table[row]) else "" for row in range(end)))
            for role, aliases in ROLE_ALIASES.items():
                if any(alias in text for alias in aliases):
                    mapping[col] = role
                    break
        if len(mapping) > len(best):
            best, best_end = mapping, end
    return best, best_end


def roles_from_column_table(table: list[list[object]]) -> list[tuple[str, dict[str, float]]]:
    columns, header_end = header_role_columns(table)
    if len(columns) < 2:
        return []
    total_rows: list[tuple[str, dict[str, Decimal]]] = []
    detail_rows: list[tuple[str, dict[str, Decimal]]] = []
    for row in table[header_end:]:
        label = compact(row[0] if row else "")
        values: dict[str, Decimal] = {}
        for col, role in columns.items():
            value = cell_number(row[col] if col < len(row) else None)
            if value is not None and value >= 0:
                values[role] = value
        if not values:
            continue
        if label in {"計", "合計"} or label.endswith("合計"):
            total_rows.append((label, values))
        elif label and not any(term in label for term in ("補正係数", "割増", "ケース", "個所数", "断面数", "ブロック数")):
            detail_rows.append((label, values))
    selected = [total_rows[-1]] if total_rows else detail_rows
    return [
        (label if not total_rows else "", {role: float(value) for role, value in values.items() if value > 0})
        for label, values in selected
        if any(value > 0 for value in values.values())
    ]


def roles_from_geology_rows(table: list[list[object]]) -> list[tuple[str, dict[str, float]]]:
    roles: dict[str, Decimal] = {}
    in_labor = False
    for row in table:
        cells = [compact(cell) for cell in row]
        if not any(cells):
            continue
        first = cells[0] if cells else ""
        if "人件費" in first:
            in_labor = True
        elif first and in_labor and not any(alias in compact("".join(cells)) for aliases in ROLE_ALIASES.values() for alias in aliases):
            in_labor = False
        if not in_labor:
            continue
        joined = compact("".join(cells))
        role = None
        for role_id in ("geologyEngineer", "geologyChiefOperator", "geologyOperator"):
            if any(alias in joined for alias in ROLE_ALIASES[role_id]):
                role = role_id
                break
        if not role:
            continue
        numeric = [cell_number(cell) for cell in cells]
        numeric = [value for value in numeric if value is not None and value >= 0]
        if numeric:
            roles[role] = roles.get(role, Decimal("0")) + numeric[-1]
    selected = {role: float(value) for role, value in roles.items() if value > 0}
    return [("", selected)] if selected else []


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def parse_year(year: int, source: dict[str, object]) -> tuple[list[dict[str, object]], dict[str, object]]:
    pdf_path = Path(source["path"])
    presets: list[dict[str, object]] = []
    label_counts: Counter[str] = Counter()
    pages_seen: set[int] = set()
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text(layout=True) or ""
            source_page = printed_page(page_text, page.page_number)
            scope = service_type(page_text, source_page)
            if scope not in {"design", "planning", "geology"}:
                continue
            for found in page.find_tables():
                table = found.extract()
                role_sets = roles_from_column_table(table)
                if not role_sets and scope == "geology":
                    role_sets = roles_from_geology_rows(table)
                if not role_sets:
                    continue
                top = max(0, float(found.bbox[1]) - 3)
                above = page.crop((0, 0, page.width, top)).extract_text(layout=True) or page_text
                code, title = source_heading(above, "標準歩掛")
                variant = source_variant(above)
                for row_label, roles in role_sets:
                    base_label = " ".join(part for part in (code, title, variant, row_label) if part).strip()
                    if not base_label or base_label == "標準歩掛":
                        base_label = f"標準歩掛 p.{source_page}"
                    label_counts[base_label] += 1
                    suffix = f"［表{label_counts[base_label]}］" if label_counts[base_label] > 1 else ""
                    service = "geologyAnalysis" if scope == "geology" and any(role.startswith("design") for role in roles) else ("geologyGeneral" if scope == "geology" else scope)
                    preset_id = f"{service}-{year}-{source_page}-{len(presets) + 1}"
                    presets.append({
                        "id": preset_id,
                        "fiscalYear": year,
                        "label": f"{base_label}{suffix}",
                        "serviceType": service,
                        "standardUnit": standard_unit(above[-1600:]),
                        "roles": roles,
                        "source": f"{source['label']} p.{source_page}",
                        "sourceUrl": source["url"],
                        "sourcePage": source_page,
                        "verificationStatus": "source-table",
                    })
                    pages_seen.add(source_page)
    audit = {
        "fiscalYear": year,
        "source": source["label"],
        "sourceUrl": source["url"],
        "sha256": sha256(pdf_path),
        "presetCount": len(presets),
        "sourcePageCount": len(pages_seen),
        "serviceCounts": dict(sorted(Counter(p["serviceType"] for p in presets).items())),
    }
    return presets, audit


def main() -> None:
    all_presets: list[dict[str, object]] = []
    audits: list[dict[str, object]] = []
    for year, source in SOURCES.items():
        presets, audit = parse_year(year, source)
        all_presets.extend(presets)
        audits.append(audit)
    payload = {
        "schemaVersion": 1,
        "generatedFrom": "official-full-standard-tables",
        "supportedYears": sorted(SOURCES, reverse=True),
        "audits": audits,
        "presets": all_presets,
    }
    json_path = ROOT / "data/consulting-standard-walks.json"
    js_path = ROOT / "data/consulting-standard-walks.js"
    json_text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    json_path.write_text(json_text, encoding="utf-8")
    js_path.write_text("window.CONSULTING_STANDARD_WALKS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({"audits": audits, "totalPresets": len(all_presets)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
