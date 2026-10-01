# AssignmentOS

A student-centered academic workspace for understanding assignment briefs, organizing course materials, writing, and checking work against editable requirements. The app is designed to support a student's own thinking and revisions rather than silently produce a submission.

The repository follows the requested service layout: Next.js/TypeScript frontend, Express/TypeScript API, FastAPI AI service, PDF/document service, PostgreSQL migrations, and shared documentation. Each service can run independently; Docker Compose provides the integrated local stack.

## Quick start

1. Run `npm run setup` (or `scripts/setup.sh` from a POSIX shell). It creates `.env` and generates persistent random database and session secrets. The default assistant uses open-source Llama 3.2 3B through Ollama; a hosted AI key is optional.
2. Start Docker Desktop, then run:

	```powershell
	npm run setup
	```

3. The setup script generates local secrets and starts Compose. On first startup, allow Compose to download the model. Open `http://localhost:3000`, create a username/password account, or sign in. API health is at `http://localhost:4000/health`.

For frontend-only development, run `cd frontend; npm install; npm run dev`. It uses mock/local browser storage if the API is unavailable. See `docs/development.md` for service-specific commands and prerequisites.

## Features

- Assignment creation with editable structured requirements.
- Rich-text editor, word counter, autosave, and draft export.
- Requirement analysis with evidence/status guidance, clearly distinguished from grading.
- Course PDF upload and page-aware keyword search.
- Welcome dashboard with navigation actions rather than an active-assignment panel; assignments and timeline remain under their own destinations.
- Student profile menu with sign out; edit username, display name, and profile photo. Theme and collapsible responsive navigation are also included.
- Assignment-aware assistant in a bottom-right chat dock, using local Llama 3.2 3B by default with deterministic fallback and optional hosted-provider support.
- Username/password accounts with bcrypt password hashes, unique database usernames, signed HttpOnly sessions, rate-limited login, and sign out.
- Debounced readiness analysis updates checklist statuses as the student edits draft text or requirements.

## Services

| Path | Responsibility | Local port |
| --- | --- | --- |
| `frontend/` | Next.js app, pages, editor, requirements and research UI | 3000 |
| `backend/` | Express API, validation, persistence and service orchestration | 4000 |
| `ai-service/` | Requirement extraction, analysis and assistant responses | 8000 |
| `document-service/` | PDF text extraction, page metadata and keyword search | 8001 |
| `database/` | PostgreSQL schema, ordered migrations and demo seed | 5432 |

The local stack is a development scaffold, not a production security posture. Replace local secrets, configure HTTPS/backups before deployment, keep provider keys in environment variables, and do not treat automated analysis as a grade. OCR, semantic retrieval, and pgvector embeddings are future work.

See `docs/architecture.md`, `docs/api.md`, `docs/database.md`, `docs/ai.md`, `docs/rag.md`, and `docs/development.md`. The separate hackathon/product roadmap remains in `NEXT_STEPS.md`.