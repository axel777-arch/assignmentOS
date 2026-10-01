from app.search.keyword_search import search_pages

def search(query: str, documents: list[dict], limit: int = 8) -> list[dict]:
    """Keep keyword retrieval available until a real embedding provider is configured."""
    return search_pages(query, documents, limit)
