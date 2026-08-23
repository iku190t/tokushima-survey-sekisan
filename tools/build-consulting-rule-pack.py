from __future__ import annotations

from collections import Counter
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re
import unicodedata

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
FULLBOOK_DIR = ROOT / "tmp/consulting-fullbooks"
CROSSWALK = ROOT / "data/source-audits/consulting-fullbook-crosswalk.json"
OUTPUT_JSON = ROOT / "data/consulting-rule-pack.json"
OUTPUT_JS = ROOT / "data/consulting-rule-pack.js"

SOURCES = {
    2024: FULLBOOK_DIR / "r6-standard.pdf",
    2025: FULLBOOK_DIR / "r7-standard.pdf",
    2026: FULLBOOK_DIR / "r8-standard.pdf",
}

ROLE_ALIASES = {
    "designPrincipal": ("主任技術者",),
    "designDirector": ("理事技師長", "技師長"),
    "designLead": ("主任技師",),
    "designEngineerA": ("技師(A)", "技師A"),
    "designEngineerB": ("技師(B)", "技師B"),
    "designEngineerC": ("技師(C)", "技師C"),
    "designTechnician": ("技術員",),
    "surveyChief": ("測量主任技師",),
    "surveyEngineer": ("測量技師",),
    "surveyAssistantEngineer": ("測量技師補",),
    "surveyAssistant": ("測量助手",),
    "surveyWorker": ("測量補助員",),
    "geologyEngineer": ("地質調査技師",),
    "geologyChiefOperator": ("主任地質調査員",),
    "geologyOperator": ("地質調査員",),
}

CODE_HEADING = re.compile(r"^\s*(\d+(?:-\d+){1,3})\s+(.+?)\s*$")
NUMBER = re.compile(r"^-?\d+(?:\.\d+)?$")
PAGE_FOOTER = re.compile(r"[-－]\s*(\d+)\s*[-－]")
UNIT = re.compile(r"[（(]([^（）()\r\n]{1,60}?(?:当り|あたり)[^（）()\r\n]{0,30})[）)]")
PERCENT_SENTENCE = re.compile(r"([^。\n]{3,180}?)(-?\d+(?:\.\d+)?)\s*[％%]([^。\n]{0,40}?(?:割増|増減|減ず|補正|乗じ)[^。\n]*)")
FACTOR_SENTENCE = re.compile(r"([^。\n]{3,180}?)((?:0|1)(?:\.\d+)?)\s*を乗じ[^。\n]*")
FORMULA_LINE = re.compile(r"^.{0,80}?[=＝].{1,160}$")
PARAMETER_TERMS = ("割増", "増減率", "補正", "変化率", "係数", "日当たり", "日数", "作業量", "規格", "工数", "ケース")


def compact(value: object) -> str:
    return re.sub(r"[\s\n\u3000]+", "", unicodedata.normalize("NFKC", str(value or ""))).replace("･", "・")


def clean_text(value: object) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", str(value or ""))).strip()


def cell_number(value: object) -> Decimal | None:
    text = compact(value).replace(",", "")
    if not NUMBER.fullmatch(text):
        return None
    try:
        return Decimal(text)
    except Exception:
        return None


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def printed_page(text: str, fallback: int) -> int:
    matches = PAGE_FOOTER.findall(text)
    return int(matches[-1]) if matches else fallback


def service_type(text: str, page_no: int) -> str | None:
    value = compact(text)
    if "第2編地質調査業務" in value:
        return "geology"
    if "第3編土木設計業務" in value:
        return "design"
    if "第4編調査・計画業務" in value or "第4編調査、計画業務" in value:
        return "planning"
    if 89 <= page_no <= 132:
        return "geology"
    if 133 <= page_no <= 284:
        return "design"
    if page_no >= 285:
        return "planning"
    return None


def heading_chain(text: str) -> list[dict[str, str]]:
    found: list[dict[str, str]] = []
    for raw in text.splitlines():
        line = clean_text(raw)
        match = CODE_HEADING.match(line)
        if not match or "---" in line or "…" in line:
            continue
        title = match.group(2).strip()
        if not title or title.startswith(("適用に当たって", "日当たり", "市場単価の設定")):
            continue
        row = {"code": match.group(1), "title": title}
        if row not in found:
            found.append(row)
    return found[-5:]


def header_role_columns(table: list[list[object]]) -> tuple[dict[int, str], int]:
    if not table:
        return {}, 0
    width = max(len(row) for row in table)
    best: dict[int, str] = {}
    best_end = 0
    for end in range(1, min(9, len(table)) + 1):
        mapping: dict[int, str] = {}
        for col in range(width):
            text = compact("".join(str(table[row][col] or "") if col < len(table[row]) else "" for row in range(end)))
            for role, aliases in ROLE_ALIASES.items():
                if any(alias in text for alias in aliases):
                    # 技師 is contained in 技師補; match the longer survey role first.
                    mapping[col] = role
                    break
        if len(mapping) > len(best):
            best, best_end = mapping, end
    return best, best_end


def table_role_rows(table: list[list[object]]) -> list[dict[str, object]]:
    columns, header_end = header_role_columns(table)
    if len(set(columns.values())) < 2:
        return []
    first_role_col = min(columns)
    detail_rows: list[dict[str, object]] = []
    total_rows: list[dict[str, object]] = []
    carry_labels = [""] * max(1, first_role_col)
    for row in table[header_end:]:
        labels = []
        for col in range(min(first_role_col, len(row))):
            value = clean_text(row[col])
            if value:
                carry_labels[col] = value
            if carry_labels[col]:
                labels.append(carry_labels[col])
        label = " ".join(dict.fromkeys(labels)).strip()
        values: dict[str, Decimal] = {}
        for col, role in sorted(columns.items()):
            value = cell_number(row[col] if col < len(row) else None)
            if value is not None and value >= 0:
                values[role] = value
        if not values or not any(value > 0 for value in values.values()):
            continue
        roles = {role: float(value) for role, value in values.items() if value > 0}
        entry = {"rowLabel": label, "roles": roles}
        if compact(label) in {"計", "合計", "総計"} or compact(label).endswith("合計"):
            total_rows.append(entry)
        elif label and not any(term in compact(label) for term in ("補正係数", "割増", "ケース", "個所数", "箇所数", "断面数", "ブロック数", "日数", "変化率")):
            detail_rows.append(entry)
    # An overall total is the calculable unit. Otherwise each work row is its own unit.
    return [total_rows[-1]] if total_rows else detail_rows


def standard_unit(context: str, row_label: str = "") -> str:
    matches = UNIT.findall(context[-2200:])
    if matches:
        return compact(matches[-1]).replace("あたり", "当り")
    inline = UNIT.findall(row_label)
    if inline:
        return compact(inline[-1]).replace("あたり", "当り")
    inline_text = re.search(r"(\d[\d,]*(?:\.\d+)?(?:km|m2|m|箇所|橋|基|トンネル|日|ケース|断面|坑口|タイプ|業務|工法|機関|孔|回|台|本|観測所|計器)(?:当り|あたり))", compact(row_label))
    return inline_text.group(1).replace("あたり", "当り") if inline_text else "1式当り"


def source_variant(context: str, leaf_title: str) -> str:
    candidates: list[str] = []
    for raw in context.splitlines()[-28:]:
        line = clean_text(raw)
        if not line or line == leaf_title or "当り" in line or "あたり" in line:
            continue
        match = re.match(r"^(?:\d+\s*[)）]|[（(]\d+[）)])\s*(.+?)\s*$", line)
        if match:
            value = match.group(1).strip()
            if value and not value.startswith(("標準歩掛", "注", "適用範囲")) and len(value) <= 80:
                candidates.append(value)
        table_title = re.match(r"^(?:表\s*\d+(?:\.\d+)?|第\s*\d+\s*表)\s*(.+?)\s*$", line)
        if table_title and table_title.group(1).strip():
            candidates.append(table_title.group(1).strip())
    return candidates[-1] if candidates else ""


def normalize_label(chain: list[dict[str, str]], row_label: str, table_index: int, variant: str = "") -> str:
    leaf = chain[-1] if chain else {"code": "", "title": "標準歩掛"}
    title = clean_text(leaf["title"])
    family = next((heading for heading in chain if len(str(heading["code"]).split("-")) == 2), None)
    family_title = clean_text(family["title"]) if family and family != leaf else ""
    row = re.sub(r"\s*(?:\d[\d,]*(?:\.\d+)?(?:km|m2|m|箇所|橋|基|トンネル|日|業務|孔|回|台|本|観測所|計器)(?:当り|あたり))\s*", "", clean_text(row_label)).strip()
    if compact(row) in {"計", "合計", "総計"}:
        row = ""
    parts = [part for part in (family_title, leaf["code"], title, variant, row) if part]
    value = " ".join(parts).strip()
    return value or f"標準歩掛 表{table_index + 1}"


def source_for_page(crosswalk: dict[tuple[int, int], dict[str, object]], year: int, physical_page: int) -> dict[str, object]:
    page = crosswalk.get((year, physical_page), {})
    candidates = page.get("sourceCandidates", [])
    if not candidates:
        return {
            "url": "https://www.mlit.go.jp/tec/gyoumu_sekisan.html",
            "page": None,
            "fiscalYear": None,
            "confidence": "unmatched",
        }
    # Prefer the strongest textual match. If multiple amendments are nearly tied,
    # the newest one is the effective replacement.
    strong = [candidate for candidate in candidates if float(candidate.get("score", 0)) >= 20]
    pool = strong or candidates
    best_score = max(float(item.get("score", 0)) for item in pool)
    selected = max(
        [item for item in pool if float(item.get("score", 0)) >= best_score - 7.5],
        key=lambda item: (int(item["fiscalYear"]), float(item["score"])),
    )
    return {
        "url": selected["url"],
        "page": selected["page"],
        "fiscalYear": selected["fiscalYear"],
        "filename": selected["filename"],
        "confidence": page.get("matchConfidence", "low"),
        "score": selected.get("score", 0),
    }


def relevant_notes(text: str) -> list[str]:
    notes: list[str] = []
    capture = False
    for raw in text.splitlines():
        line = clean_text(raw)
        if line.startswith(("（注）", "(注)", "備考")):
            capture = True
        elif re.match(r"^\d+(?:-\d+){1,3}\s", line):
            capture = False
        if capture and line and "標準積算基準書" not in line and not PAGE_FOOTER.search(line):
            value = re.sub(r"^(?:（注）|\(注\)|備考)\s*", "", line).strip()
            if value and value not in notes:
                notes.append(value)
    return notes[:20]


def applicability_text(text: str) -> list[str]:
    lines = [clean_text(line) for line in text.splitlines()]
    found: list[str] = []
    capture = False
    for line in lines:
        if re.search(r"(?:^|\s)適用範囲\s*$", line):
            capture = True
            continue
        if capture and re.match(r"^\d+(?:-\d+){1,3}\s", line):
            break
        if capture and line and "標準積算基準書" not in line and not PAGE_FOOTER.search(line):
            if len(line) <= 220 and line not in found:
                found.append(line)
    return found[:12]


def parameter_table(table: list[list[object]], table_index: int) -> dict[str, object] | None:
    rows = [[clean_text(cell) for cell in row] for row in table]
    rows = [row for row in rows if any(row)]
    if len(rows) < 2:
        return None
    joined = compact(" ".join(" ".join(row) for row in rows[:5]))
    if not any(term in joined for term in PARAMETER_TERMS):
        return None
    width = max(len(row) for row in rows)
    normalized = [row + [""] * (width - len(row)) for row in rows]
    return {"tableIndex": table_index + 1, "rows": normalized[:40]}


def family_code(chain: list[dict[str, str]]) -> str:
    for heading in reversed(chain):
        parts = str(heading["code"]).split("-")
        if len(parts) >= 2:
            return "-".join(parts[:2])
    return "common"


def detected_adjustments(text: str) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    for match in PERCENT_SENTENCE.finditer(text):
        sentence = clean_text("".join(match.groups()))
        rate = float(match.group(2)) / 100
        if "減" in match.group(3) and rate > 0:
            rate *= -1
        items.append({"type": "rate-sentence", "text": sentence, "rate": rate})
    for match in FACTOR_SENTENCE.finditer(text):
        items.append({"type": "factor-sentence", "text": clean_text(match.group(0)), "factor": float(match.group(2))})
    unique = []
    for item in items:
        if item not in unique:
            unique.append(item)
    return unique[:30]


def detected_formulas(text: str) -> list[str]:
    found = []
    for raw in text.splitlines():
        line = clean_text(raw)
        if FORMULA_LINE.match(line) and any(token in line for token in ("歩掛", "工数", "日数", "人日", "Mp", "補正", "業務費", "経費", "作業量")):
            if len(line) <= 220 and line not in found:
                found.append(line)
    return found[:20]


def main() -> None:
    crosswalk_data = json.loads(CROSSWALK.read_text(encoding="utf-8"))
    crosswalk = {
        (int(book["fiscalYear"]), int(page["physicalPage"])): page
        for book in crosswalk_data["books"]
        for page in book["pages"]
    }
    rules: list[dict[str, object]] = []
    page_rules: list[dict[str, object]] = []
    audits = []
    for fiscal_year, path in SOURCES.items():
        year_rules = []
        year_page_rules = []
        with pdfplumber.open(path) as pdf:
            for physical_page, page in enumerate(pdf.pages, 1):
                text = page.extract_text(layout=False) or ""
                printed = printed_page(text, physical_page)
                scope = service_type(text, printed)
                if scope not in {"geology", "design", "planning"}:
                    continue
                source = source_for_page(crosswalk, fiscal_year, physical_page)
                chain = heading_chain(text)
                notes = relevant_notes(text)
                applicability = applicability_text(text)
                adjustments = detected_adjustments(text)
                formulas = detected_formulas(text)
                tables = [found.extract() for found in page.find_tables()]
                parameters = [entry for index, table in enumerate(tables) if (entry := parameter_table(table, index))]
                if notes or applicability or adjustments or formulas or parameters or any(term in text for term in ("適用範囲", "市場単価", "日当たり作業量", "標準歩掛の補正", "変化率")):
                    year_page_rules.append({
                        "fiscalYear": fiscal_year,
                        "serviceType": scope,
                        "physicalPage": physical_page,
                        "printedPage": printed,
                        "headings": chain,
                        "familyCode": family_code(chain),
                        "applicability": applicability,
                        "notes": notes,
                        "adjustments": adjustments,
                        "formulas": formulas,
                        "parameterTables": parameters,
                        "source": source,
                    })
                for table_index, found in enumerate(page.find_tables()):
                    table = found.extract()
                    role_rows = table_role_rows(table)
                    if not role_rows:
                        continue
                    above = page.crop((0, 0, page.width, max(0, float(found.bbox[1]) - 2))).extract_text(layout=False) or text
                    local_chain = heading_chain(above) or chain
                    for row_index, row in enumerate(role_rows):
                        roles = row["roles"]
                        role_prefixes = {role.split("Engineer")[0] for role in roles}
                        if any(role.startswith("geology") for role in roles):
                            service = "geologyGeneral"
                            cost_system = "geology"
                        elif scope == "geology":
                            service = "geologyAnalysis"
                            cost_system = "design"
                        elif scope == "planning":
                            service = "planning"
                            cost_system = "survey" if any(role.startswith("survey") for role in roles) else "design"
                        else:
                            service = "design"
                            cost_system = "design"
                        variant = source_variant(above, local_chain[-1]["title"] if local_chain else "")
                        label = normalize_label(local_chain, str(row["rowLabel"]), table_index, variant)
                        rule_id = f"{service}-{fiscal_year}-{printed}-{table_index + 1}-{row_index + 1}"
                        entry = {
                            "id": rule_id,
                            "fiscalYear": fiscal_year,
                            "serviceType": service,
                            "costSystem": cost_system,
                            "label": label,
                            "standardUnit": standard_unit(above, str(row["rowLabel"])),
                            "roles": roles,
                            "physicalPage": physical_page,
                            "printedPage": printed,
                            "headings": local_chain,
                            "familyCode": family_code(local_chain),
                            "variant": variant,
                            "applicability": applicability,
                            "applicabilityNotes": notes,
                            "detectedAdjustments": adjustments,
                            "detectedFormulas": formulas,
                            "source": source,
                            "verificationStatus": "source-table-crosschecked" if source["confidence"] in {"high", "medium"} else "source-table-review",
                        }
                        year_rules.append(entry)
        rules.extend(year_rules)
        duplicates: Counter[tuple[str, str]] = Counter()
        for rule in year_rules:
            key = (str(rule["serviceType"]), str(rule["label"]))
            duplicates[key] += 1
            if duplicates[key] > 1:
                rule["label"] = f"{rule['label']} [表{duplicates[key]}]"
        page_rules.extend(year_page_rules)
        audits.append({
            "fiscalYear": fiscal_year,
            "sha256": sha256(path),
            "ruleCount": len(year_rules),
            "pageRuleCount": len(year_page_rules),
            "serviceCounts": dict(Counter(rule["serviceType"] for rule in year_rules)),
            "costSystemCounts": dict(Counter(rule["costSystem"] for rule in year_rules)),
            "sourceConfidenceCounts": dict(Counter(rule["source"]["confidence"] for rule in year_rules)),
        })
    families: list[dict[str, object]] = []
    family_keys = sorted({(int(rule["fiscalYear"]), str(rule["serviceType"]), str(rule["familyCode"])) for rule in rules})
    for year, service, code in family_keys:
        family_rules = [rule for rule in rules if int(rule["fiscalYear"]) == year and rule["serviceType"] == service and rule["familyCode"] == code]
        source_scope = "geology" if service.startswith("geology") else service
        related_pages = [page for page in page_rules if int(page["fiscalYear"]) == year and page["serviceType"] == source_scope and page["familyCode"] == code]
        families.append({
            "id": f"{service}-{year}-{code}",
            "fiscalYear": year,
            "serviceType": service,
            "familyCode": code,
            "title": next((heading["title"] for rule in family_rules for heading in rule["headings"] if heading["code"].startswith(code)), family_rules[0]["label"]),
            "ruleIds": [rule["id"] for rule in family_rules],
            "applicability": list(dict.fromkeys(text for page in related_pages for text in page["applicability"])),
            "notes": list(dict.fromkeys(text for page in related_pages for text in page["notes"])),
            "adjustments": [item for page in related_pages for item in page["adjustments"]],
            "formulas": list(dict.fromkeys(text for page in related_pages for text in page["formulas"])),
            "parameterTables": [table | {"physicalPage": page["physicalPage"], "printedPage": page["printedPage"], "source": page["source"]} for page in related_pages for table in page["parameterTables"]],
            "sources": list({(page["source"].get("url"), page["source"].get("page")): json.dumps(page["source"], ensure_ascii=False) for page in related_pages}.values()),
        })
    for family in families:
        family["sources"] = [json.loads(source) for source in family["sources"]]

    payload = {
        "schemaVersion": 1,
        "auditedAt": "2026-08-24",
        "supportedYears": sorted(SOURCES, reverse=True),
        "scope": "国交省基準の年度統合表を機械抽出し、本省の平成23年度本体・累積改定ページへ逆照合した規則パック。source-table-reviewは本省ページ照合の追加確認を要する。",
        "audits": audits,
        "families": families,
        "rules": rules,
        "pageRules": page_rules,
    }
    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    OUTPUT_JSON.write_text(text, encoding="utf-8")
    OUTPUT_JS.write_text("window.CONSULTING_RULE_PACK = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({"audits": audits, "familyCount": len(families), "ruleCount": len(rules), "pageRuleCount": len(page_rules)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
