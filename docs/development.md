# Development

## Prerequisites

- Node.js 22 recommended (18+ for the API scripts; Next 16 needs a modern Node runtime).
- Python 3.11+ for the two FastAPI services.
- Docker Desktop for PostgreSQL/pgvector and the all-in-one stack.

## Full local stack

```powershell
npm run setup
```

The setup script creates cryptographically random local database/JWT secrets, safely rotates an existing local database role when needed, and starts Compose. Frontend: `http://localhost:3000`; API: `http://localhost:4000/health`; AI: `http://localhost:8000/health`; documents: `http://localhost:8001/health`. Create an account or sign in from the frontend.

## Individual services

Frontend:

```powershell
cd frontend
npm ci
npm run dev
```

The frontend `.npmrc` applies the same peer-resolution setting used to create the consistent Tiptap 3.31.4 lockfile. Run `npm run typecheck` and `npm run build` before integration.

Backend:

```powershell
cd backend
npm ci
npm run migrate
npm run seed
npm run dev
```

It expects PostgreSQL at `DATABASE_URL`. Username/password sessions use bcrypt hashes and an HttpOnly JWT cookie. Production requires a unique `JWT_SECRET` of at least 32 characters and `COOKIE_SECURE=true` behind HTTPS. Local Compose defaults `COOKIE_SECURE=false` for HTTP and runs the API in production mode, so all API requests require a session.

Python services (use separate environments so both services can own an `app` package):

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Repeat in `document-service`, using port `8001`. Run each service's tests from its own directory: `python -m pytest tests -q`. Install Ollama and `ollama pull llama3.2:3b` for model-backed local coaching outside Compose.

## Integration notes

- Frontend requests use `/api`; Next rewrites them to `API_INTERNAL_URL`.
- The backend owns identity checks, database access, and orchestration.
- AI/document services receive bounded internal requests and return structured JSON.
- Never commit `.env`, service keys, uploaded student documents, generated indexes, or database files.
- `DEV_USER_ID` is a non-production API-only fallback when no session cookie exists; never enable it for a public deployment.
