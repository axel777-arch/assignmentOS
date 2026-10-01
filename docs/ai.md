# AI Service

The AI service provides structured requirement extraction, draft-versus-requirement analysis, research answers grounded in retrieved passages, and an assignment-aware study assistant. Its API is defined by Pydantic request/response schemas under `ai-service/app/schemas/`.

The default open-source model is Llama 3.2 3B served by Ollama. Compose pulls it into a persistent model volume on first startup. For local use, install Ollama, run `ollama pull llama3.2:3b`, and set `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL`, and `OLLAMA_MODEL`. An optional hosted provider is selected with `AI_PROVIDER=openai`, `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`; credentials stay server-side.

Deterministic extraction and status analysis remain available when the model is offline. Readiness status/score are decided by the deterministic checks; the model may only improve evidence wording and revision suggestions.

Analysis reports a heuristic match score plus a per-requirement status, evidence, and revision prompt. It must not be presented as a teacher grade or proof of understanding. The prompt contract requires uncertainty and forbids invented citations. Requirements remain student-editable.

Run tests from `ai-service/`:

```powershell
python -m pytest tests -q
```

Before a demo or model change, extend the fixtures across sciences, mathematics, humanities, and general research prompts, then inspect false positives/negatives and source-grounding behavior. Prompt templates are versioned text files under `app/prompts/`.
