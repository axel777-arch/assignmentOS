import json
from uuid import uuid4
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from app.config import MAX_UPLOAD_BYTES, STORAGE_PATH
from app.ingestion.text_extractor import extract_document
from app.search.semantic_search import search

app = FastAPI(title="AssignmentOS Document Service", version="0.1.0")

class SearchRequest(BaseModel):
    assignmentId: str = Field(min_length=1, max_length=100)
    query: str = Field(min_length=1, max_length=300)

@app.get("/health")
def health():
    return {"ok": True, "service": "assignmentos-document"}

@app.post("/api/documents/extract")
async def extract(assignmentId: str = Form(...), file: UploadFile = File(...)):
    if file.content_type != "application/pdf" or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(415, "Only PDF files are supported.")
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "PDF exceeds the 20 MB upload limit.")
    if not data.startswith(b"%PDF"):
        raise HTTPException(400, "File contents are not a valid PDF.")
    try:
        extracted = extract_document(data)
    except Exception as error:
        raise HTTPException(422, f"Could not extract this PDF: {error}") from error
    if not extracted["pages"]:
        raise HTTPException(422, "No selectable text was found. Scanned PDFs require OCR, which is not enabled.")
    document_id = str(uuid4())
    record = {"documentId": document_id, "assignmentId": assignmentId, "fileName": file.filename, "pageCount": extracted["pageCount"], "pages": extracted["pages"], "chunks": extracted["chunks"]}
    safe_assignment = "".join(character for character in assignmentId if character.isalnum() or character in "-_")
    (STORAGE_PATH / f"{safe_assignment}-{document_id}.json").write_text(json.dumps(record, ensure_ascii=False), encoding="utf-8")
    return record

@app.post("/api/search")
def search_documents(request: SearchRequest):
    documents = []
    for file in STORAGE_PATH.glob("*.json"):
        try:
            record = json.loads(file.read_text(encoding="utf-8"))
            if record.get("assignmentId") == request.assignmentId:
                documents.append(record)
        except (OSError, json.JSONDecodeError):
            continue
    return {"results": search(request.query, documents)}
