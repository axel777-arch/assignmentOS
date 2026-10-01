from app.ingestion.pdf_reader import extract_text_pages
from app.ingestion.chunker import page_chunks

def extract_document(data: bytes) -> dict:
    page_count, pages = extract_text_pages(data)
    return {"pageCount": page_count, "pages": pages, "chunks": page_chunks(pages)}
