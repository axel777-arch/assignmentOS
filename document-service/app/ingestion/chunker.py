import re
from collections.abc import Iterable

def chunk_text(text: str, size: int = 240, overlap: int = 35) -> list[str]:
    words = re.findall(r"\S+", text)
    if not words:
        return []
    chunks: list[str] = []
    step = max(1, size - overlap)
    for start in range(0, len(words), step):
        chunk = " ".join(words[start:start + size]).strip()
        if chunk:
            chunks.append(chunk)
        if start + size >= len(words):
            break
    return chunks

def page_chunks(pages: Iterable[dict[str, int | str]]) -> list[dict[str, int | str]]:
    chunks = []
    for page in pages:
        for index, text in enumerate(chunk_text(str(page["text"]))):
            chunks.append({"page": int(page["page"]), "chunk": index, "text": text})
    return chunks
