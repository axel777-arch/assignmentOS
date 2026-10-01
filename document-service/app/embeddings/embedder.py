from collections.abc import Sequence

def embed_texts(texts: Sequence[str]) -> list[list[float]]:
    raise NotImplementedError("Embedding provider is not configured; keyword retrieval remains available.")
