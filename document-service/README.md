# Document Service

FastAPI service for validated PDF extraction, page-aware chunking, and keyword search. Run from this directory after installing `requirements.txt`:

```powershell
python -m uvicorn app.main:app --reload --port 8001
python -m pytest tests -q
```

Only text-selectable PDFs are supported; OCR and embedding generation are not implemented. The local JSON index is configured by `DOCUMENT_STORAGE_PATH` and should be replaced by private object storage/database indexing before production.
