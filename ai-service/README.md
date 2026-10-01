# AI Service

FastAPI service for requirement extraction, heuristic analysis, assignment coaching, and passage-grounded research. Run from this directory after installing `requirements.txt`:

```powershell
python -m uvicorn app.main:app --reload --port 8000
python -m pytest tests -q
```

The service works without credentials. Set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` in the server environment to enable model-backed assistant/research responses. Never expose those values to the browser.
