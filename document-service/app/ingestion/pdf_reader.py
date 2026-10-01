from io import BytesIO
from pypdf import PdfReader

def extract_text_pages(data: bytes) -> tuple[int, list[dict[str, int | str]]]:
    reader = PdfReader(BytesIO(data), strict=False)
    if reader.is_encrypted:
        raise ValueError("Password-protected PDFs are not supported.")
    pages: list[dict[str, int | str]] = []
    for page_number, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").replace("\x00", " ").strip()
        if text:
            pages.append({"page": page_number, "text": text})
    return len(reader.pages), pages
