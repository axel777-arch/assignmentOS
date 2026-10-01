# API

All Express routes are mounted under `/api`. JSON responses use `{ "data": ... }`; errors use `{ "error": { "message": "..." } }`. Requests are validated with Zod. Assignment and document operations require an authenticated user in production. Local non-production mode uses the configured `DEV_USER_ID` when no session cookie is present.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API process health |
| `GET` | `/api/health` | Health and assistant provider (`ollama`, `openai`, or `local`) |
| `POST` | `/api/auth/register` | Create a student account and set an HttpOnly session cookie |
| `POST` | `/api/auth/login` | Verify username/password and set an HttpOnly session cookie |
| `POST` | `/api/auth/logout` | Clear the current session |
| `GET` | `/api/auth/me` | Resolve the current authenticated student |
| `PATCH` | `/api/auth/profile` | Update username, display name, and a validated PNG/JPEG/WebP avatar |
| `GET`, `POST` | `/api/assignments` | List/create assignments |
| `GET`, `PATCH`, `DELETE` | `/api/assignments/:id` | Read/update/delete an owned assignment |
| `POST` | `/api/requirements/extract` | Extract a proposed checklist from `{ brief, targetWords? }` |
| `PUT` | `/api/requirements/:assignmentId` | Replace editable checklist entries |
| `PUT` | `/api/drafts/:assignmentId` | Save `{ content }` draft HTML |
| `POST` | `/api/documents` | Upload one PDF as multipart form fields `file` and `assignmentId` |
| `POST` | `/api/analysis` | Analyze `{ assignmentId, draft? }` |
| `POST` | `/api/research` | Search `{ assignmentId, query }` and return page-aware source results |
| `POST` | `/api/assistant` | Coach on `{ assignmentId, message }` |

Credential endpoints are rate-limited. Passwords are bcrypt-hashed; usernames are unique case-insensitively. A signed 12-hour JWT is stored in an HttpOnly, SameSite=Lax cookie. `JWT_SECRET` must be a unique secret of at least 32 characters in production. Passwords and session tokens are not stored in the users table.

The backend forwards to internal Python service routes:

- AI: `POST /api/requirements/extract`, `POST /api/analysis`, `POST /api/research`, `POST /api/assistant` on port 8000.
- Documents: `POST /api/documents/extract` and `POST /api/search` on port 8001.

The response shape is deliberately structured so the frontend does not depend on model/provider implementation. Rate limits apply to analysis, research, and assistant operations. The document service enforces PDF MIME/extension and a 20 MB maximum.
