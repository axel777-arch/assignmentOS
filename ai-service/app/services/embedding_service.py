from collections.abc import Sequence


def embed_texts(texts: Sequence[str]) -> list[list[float]]:
    """Placeholder boundary for the configured embedding provider; no vectors are fabricated."""
    raise NotImplementedError("Configure an embedding provider before enabling semantic retrieval.")
