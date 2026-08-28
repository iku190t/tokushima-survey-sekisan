from __future__ import annotations

from collections import Counter
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "data" / "source-audits" / "maff-land-improvement-sources.json"
OUTPUT_JSON = ROOT / "data" / "maff-rule-pack.json"
OUTPUT_JS = ROOT / "data" / "maff-rule-pack.js"

spec = importlib.util.spec_from_file_location("mlit_rule_builder", ROOT / "tools" / "build-consulting-rule-pack.py")
mlit = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(mlit)


def source_scope(doc_id: str, text: str, roles: dict[str, float], physical_page: int = 0) -> tuple[str, str]:
    role_ids = set(roles)
    if any(role.startswith("geology") for role in role_ids):
        return "geologyGeneral", "geology"
    if any(role.startswith("survey") for role in role_ids):
        return "survey", "survey"
    if doc_id == "investigation":
        return "geologyAnalysis", "design"
    if doc_id == "reference-walk":
        # R8: pp.328-347 are the investigation portion of the functional
        # diagnosis reference walk; the preceding and following tables are
        # design work.
        return ("planning", "design") if 328 <= physical_page < 348 else ("design", "design")
    if doc_id == "reference-walk-3":
        # R6/R7 split the same appendix into a third PDF.  Its first 16
        # pages are investigation and pp.17 onward are design.
        return ("planning", "design") if physical_page < 17 else ("design", "design")
    if doc_id.startswith("reference-walk"):
        return "design", "design"
    if doc_id == "business-materials":
        return "planning", "design"
    return "design", "design"


def family_code(doc_id: str, chain: list[dict[str, str]]) -> str:
    code = mlit.family_code(chain)
    prefix = {
        "investigation": "調査",
        "survey": "測量",
        "design": "設計",
        "business-materials": "業務資料",
        "reference-walk": "参考歩掛",
        "reference-walk-1": "参考歩掛1",
        "reference-walk-2": "参考歩掛2",
        "reference-walk-3": "参考歩掛3",
    }.get(doc_id, doc_id)
    return f"{prefix}-{code}"


def service_type_for_page(doc_id: str, text: str, physical_page: int = 0) -> str:
    value = mlit.compact(text)
    if doc_id == "investigation":
        return "geology"
    if doc_id == "survey":
        return "survey"
    if doc_id == "design":
        return "design"
    if doc_id == "reference-walk":
        return "planning" if 328 <= physical_page < 348 else "design"
    if doc_id == "reference-walk-3":
        return "planning" if physical_page < 17 else "design"
    if doc_id.startswith("reference-walk"):
        return "design"
    if "測量" in value and not any(term in value for term in ("設計業務", "地質調査")):
        return "survey"
    if any(term in value for term in ("地質", "土質", "ボーリング", "サンプリング", "サウンディング")):
        return "geology"
    return "planning"


def market_price_rows(table: list[list[object]], context: str) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    normalized = [[mlit.clean_text(cell) for cell in row] for row in table]
    for row in normalized:
        cells = [cell for cell in row if cell]
        if not cells:
            continue
        joined = " ".join(cells)
        unit = next((unit for unit in ("m", "本", "回", "箇所", "孔", "日", "式", "m2", "m3", "t") if re.search(rf"(?:^|\s){re.escape(unit)}(?:\s|$)", joined)), "")
        if not unit:
            continue
        name = cells[0]
        if name in {"種別", "区分", "規格", "単位", "摘要", "作業種別"} or len(name) < 2:
            continue
        compact_name = mlit.compact(name)
        if any(term in compact_name for term in ("区分・", "規格区分", "土質区分", "岩区分", "人員")):
            continue
        if not any(term in context for term in ("市場単価", "設計単価")):
            continue
        rows.append({"name": name, "unit": unit, "cells": cells[:10]})
    unique: list[dict[str, object]] = []
    for row in rows:
        if row not in unique:
            unique.append(row)
    return unique[:40]


def spread_role_rows(left_table: list[list[object]], right_table: list[list[object]]) -> list[dict[str, object]]:
    """Join MAFF's facing-page work descriptions and labor walk table by row."""
    columns, header_end = mlit.header_role_columns(right_table)
    if len(set(columns.values())) < 2:
        return []
    offset = len(left_table) - len(right_table)
    rows: list[dict[str, object]] = []
    carry = ""
    for right_index in range(header_end, len(right_table)):
        left_index = right_index + offset
        if not 0 <= left_index < len(left_table):
            continue
        left = left_table[left_index]
        label = mlit.clean_text(left[0] if left else "")
        if label:
            carry = label
        elif carry:
            label = carry
        values: dict[str, float] = {}
        right = right_table[right_index]
        for col, role in columns.items():
            value = mlit.cell_number(right[col] if col < len(right) else None)
            if value is not None and value > 0:
                values[role] = float(value)
        if label and values:
            rows.append({"rowLabel": label, "roles": values, "rightRow": right_index})
    return rows


def unicode_pages(path: Path) -> list[str]:
    executable = shutil.which("pdftotext") or r"C:\poppler-24.08.0\Library\bin\pdftotext.exe"
    completed = subprocess.run(
        [executable, "-layout", "-enc", "UTF-8", str(path), "-"],
        check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    return completed.stdout.decode("utf-8", errors="strict").split("\f")


def task_labels(text: str) -> list[str]:
    candidates: list[tuple[str, str]] = []
    for raw in text.splitlines():
        match = re.match(r"^\s*(\d+(?:[-－]\d+){0,3})\s+(.+?)(?:\s{2,}|$)", raw)
        if not match:
            continue
        code = match.group(1).replace("－", "-")
        title = mlit.clean_text(match.group(2))
        if not title or title in {"適用範囲", "作業項目", "標準歩掛"}:
            continue
        candidates.append((code, title))
    result: list[str] = []
    for code, title in candidates:
        if "-" not in code and any(other.startswith(code + "-") for other, _ in candidates):
            continue
        label = f"{code} {title}"
        if label not in result:
            result.append(label)
    return result


def spread_numeric_rows(right_table: list[list[object]]) -> list[dict[str, object]]:
    columns, header_end = mlit.header_role_columns(right_table)
    if len(set(columns.values())) < 2:
        return []
    rows: list[dict[str, object]] = []
    for right_index in range(header_end, len(right_table)):
        right = right_table[right_index]
        values: dict[str, float] = {}
        for col, role in columns.items():
            value = mlit.cell_number(right[col] if col < len(right) else None)
            if value is not None and value > 0:
                values[role] = float(value)
        if values:
            rows.append({"roles": values, "rightRow": right_index})
    return rows


def survey_expense_rates(text: str) -> dict[str, float]:
    compact = re.sub(r"[ \t\u3000]+", "", text)
    rates: dict[str, float] = {}
    patterns = {
        "machineRate": r"機械経費\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]",
        "communicationRate": r"通信運搬費等\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]",
        "materialRate": r"材料費\s*([0-9]+(?:\.[0-9]+)?)\s*[％%]",
    }
    for key, pattern in patterns.items():
        match = re.search(pattern, compact)
        rates[key] = float(match.group(1)) / 100 if match else 0.0
    return rates


def standard_unit_from_text(text: str) -> str:
    compact = re.sub(r"[ \t\u3000]+", "", text)
    match = re.search(r"標準作業量.{0,120}?([0-9][0-9,.]*)\s*(10,000m2|km2|m2|m3|km|ha|m|点|箇所|回|機関|業務|戸|人|測線|断面|本|枚|筆|日|橋|基|件|施設|トンネル)", compact, re.S)
    if not match:
        return ""
    return f'{match.group(1).replace(",", "")}{match.group(2)}当り'


def standard_units_from_text(text: str) -> list[str]:
    compact = re.sub(r"[ \t\u3000]+", "", text)
    units: list[str] = []
    for match in re.finditer(r"標準作業量.{0,160}?([0-9][0-9,.]*)\s*(10,000m2|km2|m2|m3|km|ha|m|点|箇所|回|機関|業務|戸|人|測線|断面|本|枚|筆|日|橋|基|件|施設|トンネル)", compact, re.S):
        value = f'{match.group(1).replace(",", "")}{match.group(2)}当り'
        units.append(value)
    return units


def main() -> None:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    documents = [doc for doc in audit["documents"] if doc["usage"] in {"calculation", "reference-walk"}]
    rules: list[dict[str, object]] = []
    page_rules: list[dict[str, object]] = []
    market_rules: list[dict[str, object]] = []
    table_count = 0
    for document_index, document in enumerate(documents, 1):
        fiscal_year = int(document["fiscalYear"])
        doc_id = str(document["docId"])
        path = ROOT / "tmp" / "pdfs" / "maff-land-improvement" / str(fiscal_year) / f"{doc_id}.pdf"
        unicode_texts = unicode_pages(path)
        with pdfplumber.open(path) as pdf:
            spread_pages: set[int] = set()
            if doc_id in {"design", "business-materials", "reference-walk", "reference-walk-1", "reference-walk-2", "reference-walk-3"}:
                for left_index in range(len(pdf.pages) - 1):
                    left_found = pdf.pages[left_index].find_tables()
                    right_found = pdf.pages[left_index + 1].find_tables()
                    if len(left_found) != 1 or len(right_found) != 1:
                        continue
                    left_table, right_table = left_found[0].extract(), right_found[0].extract()
                    right_columns, _ = mlit.header_role_columns(right_table)
                    left_width = max((len(row) for row in left_table), default=0)
                    if left_width > 3 or len(set(right_columns.values())) < 2 or min(right_columns, default=1) != 0:
                        continue
                    numeric_rows = spread_numeric_rows(right_table)
                    labels = task_labels(unicode_texts[left_index] if left_index < len(unicode_texts) else "")
                    if not numeric_rows or not labels or abs(len(labels) - len(numeric_rows)) > 1:
                        continue
                    if len(labels) > len(numeric_rows):
                        labels = labels[-len(numeric_rows):]
                    elif len(numeric_rows) > len(labels):
                        numeric_rows = numeric_rows[-len(labels):]
                    spread = [{**row, "rowLabel": label} for row, label in zip(numeric_rows, labels)]
                    left_text = unicode_texts[left_index] if left_index < len(unicode_texts) else ""
                    right_text = unicode_texts[left_index + 1] if left_index + 1 < len(unicode_texts) else ""
                    chain = mlit.heading_chain(left_text) or mlit.heading_chain(right_text)
                    unit = mlit.standard_unit(left_text + "\n" + right_text)
                    applicability = mlit.applicability_text(left_text + "\n" + right_text)
                    notes = mlit.relevant_notes(left_text + "\n" + right_text)
                    adjustments = mlit.detected_adjustments(left_text + "\n" + right_text)
                    formulas = mlit.detected_formulas(left_text + "\n" + right_text)
                    for row_index, row in enumerate(spread):
                        service, cost_system = source_scope(doc_id, left_text + right_text, row["roles"], left_index + 2)
                        rules.append({
                            "id": f"maff-{service}-{fiscal_year}-{doc_id}-spread-{left_index + 1}-{row_index + 1}",
                            "standardSystem": "maff-land-improvement", "fiscalYear": fiscal_year,
                            "serviceType": service, "costSystem": cost_system,
                            "label": mlit.clean_text(row["rowLabel"]), "standardUnit": unit,
                            "quantitySpec": mlit.quantity_spec(unit), "roles": row["roles"],
                            "docId": doc_id, "physicalPage": left_index + 2, "headings": chain,
                            "familyCode": f"{doc_id}-p{left_index + 1}", "variant": "見開き歩掛表",
                            "applicability": applicability, "applicabilityNotes": notes,
                            "detectedAdjustments": adjustments, "detectedFormulas": formulas,
                            "source": {"url": document["url"], "page": left_index + 2, "title": document["title"], "confidence": "high"},
                            "sourceKind": "official-reference-walk" if doc_id.startswith("reference-walk") else "official-standard",
                            "verificationStatus": "maff-official-facing-table",
                        })
                    spread_pages.add(left_index + 1)
            for physical_page, page in enumerate(pdf.pages, 1):
                text = unicode_texts[physical_page - 1] if physical_page - 1 < len(unicode_texts) else (page.extract_text(layout=False) or "")
                chain = mlit.heading_chain(text)
                scope = service_type_for_page(doc_id, text, physical_page)
                applicability = mlit.applicability_text(text)
                notes = mlit.relevant_notes(text)
                adjustments = mlit.detected_adjustments(text)
                formulas = mlit.detected_formulas(text)
                found_tables = page.find_tables()
                page_standard_units = standard_units_from_text(text)
                role_table_index = 0
                table_count += len(found_tables)
                parameters = [entry for index, found in enumerate(found_tables) if (entry := mlit.parameter_table(found.extract(), index))]
                if applicability or notes or adjustments or formulas or parameters:
                    page_rules.append({
                        "id": f"maff-{fiscal_year}-{doc_id}-{physical_page}",
                        "fiscalYear": fiscal_year, "docId": doc_id, "serviceType": scope,
                        "physicalPage": physical_page, "headings": chain,
                        "familyCode": f"{doc_id}-p{physical_page}", "applicability": applicability,
                        "notes": notes, "adjustments": adjustments, "formulas": formulas,
                        "parameterTables": parameters,
                        "source": {"url": document["url"], "page": physical_page, "title": document["title"], "confidence": "high"},
                    })
                for table_index, found in enumerate(found_tables):
                    table = found.extract()
                    above = text
                    local_chain = chain
                    role_rows = [] if physical_page in spread_pages else mlit.table_role_rows(table)
                    table_unit = page_standard_units[min(role_table_index, len(page_standard_units) - 1)] if page_standard_units else ""
                    if role_rows:
                        role_table_index += 1
                    for row_index, row in enumerate(role_rows):
                        roles = row["roles"]
                        service, cost_system = source_scope(doc_id, text, roles, physical_page)
                        variant = mlit.source_variant(above, local_chain[-1]["title"] if local_chain else "")
                        # Keep the UI label to the official heading and row name.
                        # `variant` can contain an entire explanatory sentence and
                        # remains available as metadata, but must not make the work
                        # item selector unreadable.
                        label = mlit.normalize_label(local_chain, str(row["rowLabel"]), table_index, "")
                        unit = table_unit or mlit.standard_unit(above, str(row["rowLabel"]))
                        # 1-3 is the worked example that explains how condition rates are
                        # combined.  It is a rule source, not an estimate work item.
                        if doc_id == "survey" and local_chain and local_chain[-1].get("code") == "1-3":
                            continue
                        expense_rates = survey_expense_rates(text) if doc_id == "survey" else {}
                        rules.append({
                            "id": f"maff-{service}-{fiscal_year}-{doc_id}-{physical_page}-{table_index + 1}-{row_index + 1}",
                            "standardSystem": "maff-land-improvement", "fiscalYear": fiscal_year,
                            "serviceType": service, "costSystem": cost_system, "label": label,
                            "standardUnit": unit, "quantitySpec": mlit.quantity_spec(unit), "roles": roles,
                            **expense_rates,
                            "docId": doc_id, "physicalPage": physical_page, "headings": local_chain,
                            "familyCode": f"{doc_id}-p{physical_page}", "variant": variant,
                            "applicability": applicability, "applicabilityNotes": notes,
                            "detectedAdjustments": adjustments, "detectedFormulas": formulas,
                            "source": {"url": document["url"], "page": physical_page, "title": document["title"], "confidence": "high"},
                            "sourceKind": "official-reference-walk" if doc_id.startswith("reference-walk") else "official-standard",
                            "verificationStatus": "maff-official-table",
                        })
                    for market_index, market in enumerate(market_price_rows(table, above)):
                        market_rules.append({
                            "id": f"maff-market-{fiscal_year}-{doc_id}-{physical_page}-{table_index + 1}-{market_index + 1}",
                            "standardSystem": "maff-land-improvement", "fiscalYear": fiscal_year,
                            "serviceType": "geologyGeneral" if doc_id == "investigation" else "planning",
                            "costSystem": "geology" if doc_id == "investigation" else "design",
                            "label": market["name"], "standardUnit": f'1{market["unit"]}当り',
                            "quantitySpec": mlit.quantity_spec(f'1{market["unit"]}当り'),
                            "pricingMode": "official-market-unit-price-input", "marketCells": market["cells"],
                            "docId": doc_id, "physicalPage": physical_page,
                            "familyCode": f"{doc_id}-p{physical_page}",
                            "source": {"url": document["url"], "page": physical_page, "title": document["title"], "confidence": "high"},
                            "sourceKind": "official-reference-walk" if doc_id.startswith("reference-walk") else "official-standard",
                            "verificationStatus": "maff-official-market-price-method",
                        })
        print(f'[{document_index:02d}/{len(documents):02d}] R{fiscal_year - 2018} {document["title"]}', flush=True)

    # Keep official table variants separate while eliminating exact extraction duplicates.
    unique_rules: list[dict[str, object]] = []
    seen: set[tuple[object, ...]] = set()
    for rule in rules:
        # The same task name and crew can legitimately occur in different
        # official tables.  Preserve the document/page identity so variants
        # are never collapsed across facilities or specifications.
        key = (rule["fiscalYear"], rule["serviceType"], rule["docId"], rule["physicalPage"], rule["label"], rule["standardUnit"], json.dumps(rule["roles"], sort_keys=True))
        if key in seen:
            continue
        seen.add(key)
        unique_rules.append(rule)
    unique_market: list[dict[str, object]] = []
    seen_market: set[tuple[object, ...]] = set()
    for rule in market_rules:
        key = (rule["fiscalYear"], rule["serviceType"], rule["docId"], rule["physicalPage"], rule["label"], rule["standardUnit"])
        if key in seen_market:
            continue
        seen_market.add(key)
        unique_market.append(rule)
    all_rules = unique_rules + unique_market
    families: list[dict[str, object]] = []
    family_keys = sorted({(int(rule["fiscalYear"]), str(rule["serviceType"]), str(rule["familyCode"])) for rule in all_rules})
    for year, service, code in family_keys:
        members = [rule for rule in all_rules if int(rule["fiscalYear"]) == year and rule["serviceType"] == service and rule["familyCode"] == code]
        doc_ids = {str(rule.get("docId", "")) for rule in members}
        source_pages = {int(rule.get("physicalPage", 0)) for rule in members}
        related = [page for page in page_rules if int(page["fiscalYear"]) == year and str(page["docId"]) in doc_ids and any(abs(int(page["physicalPage"]) - source_page) <= 1 for source_page in source_pages)]
        def unique_values(key: str) -> list[object]:
            result: list[object] = []
            for page in related:
                for value in page.get(key, []):
                    if value not in result:
                        result.append(value)
            return result
        sources = []
        for member in members:
            source = member.get("source")
            if source and source not in sources:
                sources.append(source)
        families.append({
            "id": f"maff-{service}-{year}-{code}", "fiscalYear": year,
            "serviceType": service, "familyCode": code,
            "title": members[0]["label"] if members else code,
            "ruleIds": [member["id"] for member in members],
            "applicability": unique_values("applicability"), "notes": unique_values("notes"),
            "adjustments": unique_values("adjustments"), "formulas": unique_values("formulas"),
            "parameterTables": unique_values("parameterTables"), "sources": sources,
        })
    payload = {
        "schemaVersion": 1, "auditedAt": "2026-08-28", "standardSystem": "maff-land-improvement",
        "scope": "農林水産省 土地改良工事積算基準（調査・測量・設計）令和6～8年度の公式表・条件・式",
        "supportedYears": [2026, 2025, 2024], "documentCount": len(documents), "tableCount": table_count,
        "ruleCount": len(all_rules), "roleRuleCount": len(unique_rules), "marketRuleCount": len(unique_market),
        "serviceCounts": dict(Counter(str(rule["serviceType"]) for rule in all_rules)),
        "yearCounts": dict(Counter(str(rule["fiscalYear"]) for rule in all_rules)),
        "pageRuleCount": len(page_rules), "familyCount": len(families),
        "rules": all_rules, "families": families, "pageRules": page_rules,
    }
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUTPUT_JS.write_text("window.MAFF_RULE_PACK = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({key: payload[key] for key in ("documentCount", "tableCount", "ruleCount", "roleRuleCount", "marketRuleCount", "serviceCounts", "yearCounts", "pageRuleCount")}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
