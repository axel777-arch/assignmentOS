import re
from collections.abc import Iterable

def search_pages(query: str, documents: Iterable[dict], limit: int = 8) -> list[dict]:
    terms = [term.casefold() for term in re.findall(r"[\w-]+", query) if len(term) > 1]
    if not terms:
        return []
    hits = []
    for document in documents:
        for page in document.get("pages", []):
            text = str(page.get("text", ""))
            lowered = text.casefold()
            matched = [term for term in terms if term in lowered]
            if not matched:
                continue
            position = min(lowered.find(term) for term in matched)
            start = max(0, position - 70)
            excerpt = text[start:start + 260]
            hits.append({"documentId": document["documentId"], "documentName": document["fileName"], "page": page["page"], "excerpt": ("…" if start else "") + excerpt + ("…" if start + 260 < len(text) else ""), "score": len(matched) / len(terms)})
    return sorted(hits, key=lambda item: item["score"], reverse=True)[:limit]
