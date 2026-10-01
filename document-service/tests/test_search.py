from app.search.keyword_search import search_pages
from app.ingestion.chunker import chunk_text


def test_search_keeps_document_and_page_metadata():
    docs = [{"documentId": "doc-1", "fileName": "notes.pdf", "pages": [{"page": 4, "text": "Electrolysis moves ions through an electrolyte."}]}]
    result = search_pages("electrolysis", docs)
    assert result[0]["page"] == 4
    assert result[0]["documentName"] == "notes.pdf"


def test_chunk_overlap_has_bounded_chunk_size():
    chunks = chunk_text(" ".join(f"term{i}" for i in range(500)), size=60, overlap=10)
    assert len(chunks) > 1
    assert all(len(chunk.split()) <= 60 for chunk in chunks)
