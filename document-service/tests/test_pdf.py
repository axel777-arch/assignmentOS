from io import BytesIO
from pypdf import PdfWriter
from app.ingestion.pdf_reader import extract_text_pages


def test_blank_pdf_preserves_page_count_without_fabricating_text():
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    output = BytesIO()
    writer.write(output)
    page_count, pages = extract_text_pages(output.getvalue())
    assert page_count == 1
    assert pages == []
