import re
import json
from uuid import uuid4
from app.schemas.requirements import Requirement
from app.services.llm_service import complete

QUANTITIES = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
ACTION = r"explain|discuss|describe|analyze|analyse|compare|evaluate|cover|address"

def _quantity(value: str) -> int:
    return int(value.replace(",", "")) if value.replace(",", "").isdigit() else QUANTITIES.get(value.lower(), 0)

def extract_requirements(brief: str, target_words: int = 0) -> list[Requirement]:
    requirements: list[Requirement] = []
    seen: set[str] = set()
    def add(text: str, kind: str):
        clean = text.strip().rstrip(".!? ")
        if clean and clean.casefold() not in seen:
            seen.add(clean.casefold())
            requirements.append(Requirement(id=str(uuid4()), text=clean, kind=kind))

    range_match = re.search(r"\b(\d[\d,]*|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:-|to|–)\s*(\d[\d,]*|one|two|three|four|five|six|seven|eight|nine|ten)\s*(words?|pages?)\b", brief, re.I)
    if range_match:
        add(f"Write between {_quantity(range_match.group(1)):,} and {_quantity(range_match.group(2)):,} {range_match.group(3).lower()}", "length")
    elif target_words:
        add(f"Write approximately {target_words:,} words", "length")

    source_match = re.search(r"\b(?:at least|minimum of|min\.?\s*)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:academic\s+|credible\s+|scholarly\s+)?sources?\b", brief, re.I)
    if source_match:
        add(f"Use at least {_quantity(source_match.group(1))} identifiable sources", "sources")

    section_match = re.search(r"\b(?:include|with|containing)\s+((?:(?:an?\s+)?(?:introduction|conclusion|abstract|methodology|discussion|results))(?:\s*(?:,|and|&)\s*(?:an?\s+)?(?:introduction|conclusion|abstract|methodology|discussion|results))*)", brief, re.I)
    if section_match:
        for section in re.split(r",|\band\b|&", section_match.group(1), flags=re.I):
            add(f"Include a {section.strip().lower()} section", "section")

    pattern = rf"\b({ACTION})\s+([^.!?]+?)(?=\s+(?:and\s+)?(?:{ACTION})\b|[.!?]|$)"
    for match in re.finditer(pattern, brief, re.I):
        if len(match.group(2).strip()) > 3:
            add(f"{match.group(1)} {match.group(2).strip()}", "concept")
    if not requirements and brief.strip():
        add(brief.strip().split(".", 1)[0], "concept")
    if not requirements:
        add("Add a key idea from the assignment brief", "concept")
    return requirements

async def extract_with_model(brief: str, target_words: int = 0) -> tuple[list[Requirement], float]:
    deterministic = extract_requirements(brief, target_words)
    generated = await complete([{"role": "user", "content": "Extract only explicit student requirements from this assignment brief. Return JSON only in the form {\"requirements\":[{\"text\":\"...\",\"kind\":\"concept|section|length|sources|deadline\"}]}. Do not add generic study advice or infer unstated grading rules. Brief: " + brief[:12000] + f"\nTarget words entered separately: {target_words or 'none'}"}], temperature=0.1)
    if not generated:
        return deterministic, 0.65
    try:
        cleaned = generated.strip().removeprefix("```json").removesuffix("```").strip()
        payload = json.loads(cleaned)
        model_items = payload.get("requirements", []) if isinstance(payload, dict) else []
        merged = {item.text.casefold(): item for item in deterministic}
        for item in model_items[:30]:
            if not isinstance(item, dict) or not isinstance(item.get("text"), str):
                continue
            kind = item.get("kind", "concept")
            if kind not in {"concept", "section", "length", "sources", "deadline"}:
                kind = "concept"
            text = item["text"].strip()[:1000]
            if text and text.casefold() not in merged:
                merged[text.casefold()] = Requirement(id=str(uuid4()), text=text, kind=kind, status="not_checked")
        return list(merged.values()), 0.9
    except (json.JSONDecodeError, AttributeError, TypeError):
        return deterministic, 0.5
