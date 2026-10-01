# Product and Architecture Guide

## Product intent

AssignmentOS keeps the student's work as the primary artifact. Its workflow is:

1. Create an assignment and paste the teacher's brief.
2. Review and correct the extracted requirements.
3. Write and revise a draft in the workspace.
4. Add course PDFs and search page-aware text passages.
5. Run a readiness check, investigate the gaps, revise, and export.

The checker is not an official grade. It reports heuristics that a student should verify against the assignment and source material.

## What is implemented

| Proposal area | Current behavior | Boundary |
| --- | --- | --- |
| Assignment creation | Title, course, deadline, brief, and optional word target | Stored in this browser only |
| Requirements pipeline | Extracts word/page ranges, numeric or common spelled-out source counts, familiar required section labels, and separate action-led concepts | Rule-based parsing; edit the resulting list |
| Writing | Content-editable editor with basic emphasis, headings, lists, word count, and local autosave | Basic browser editor, not Tiptap or versioned drafts |
| Readiness analysis | Checks word range, keyword overlap, bibliography/in-text references, and actual editor headings | No embeddings, model, semantic entailment, or teacher-grade prediction |
| Course material ingestion | Validates PDF extension/type and a 20 MB maximum, extracts text per page with PDF.js | Selectable-text PDFs only; scanned images and OCR are not supported |
| Course material search | Case-insensitive keyword matching, ranked by matched query terms, with filename and page metadata | No semantic retrieval, generated answer, or citation generation |
| Overview and timeline | Lists local assignments and sorts due dates | No calendar integration or milestone planning |
| Export | Downloads the draft as a UTF-8 text file | No DOCX/PDF formatting export |

## Running and storage

The frontend is split into `index.html`, `styles.css`, and `app.js`. Run `npm start` with Node.js 18 or later and open `http://127.0.0.1:3000`. The app also opens directly as a static file with browser-only persistence and coaching. PDF.js 3.11.174 is loaded from cdnjs, and typefaces are loaded from Google Fonts, so PDF extraction and hosted fonts need network access.

When the server is active, assignment state and extracted PDF page text are persisted in the git-ignored `data/store.json`. The backend binds to loopback (`127.0.0.1`); it has no authentication and is intended for one local developer, not deployment or shared use. Browser `localStorage` under `assignmentos-v1` remains the offline fallback. The PDF original is not uploaded: the browser extracts page text and syncs that text to the local API. Do not add secrets to client files. Set `AI_API_KEY`, optional `AI_BASE_URL`, and `AI_MODEL` in the server process to enable the OpenAI-compatible assistant; without a key, `/api/assistant` returns deterministic local coaching guidance.

The current workspace object is intentionally small:

```text
Workspace
  assignments[]
    id, title, course, subject, due
    targetWords, minWords, maxWords, sourceTarget
    instructions, requirements[], content
  activeId
  materials[]
    id, name, size, pages[{ page, text }]
  profile
    name, course, theme
```

Requirement entries have an `id`, editable `text`, a `type` (`length`, `sources`, `section`, `deadline`, or `concept`), and a student-editable `status`. The prototype persists HTML draft content locally; any server implementation must sanitize rich text before rendering it.

## Suggested production boundaries

The proposal's Next.js/TypeScript client, Python/FastAPI AI and document services, PostgreSQL/pgvector, and private object storage remain future work. The prototype now has a small dependency-free Node API (`server.js`) for local state persistence and assignment CRUD. Its endpoints are `GET /api/health`, `GET|PUT /api/state`, `GET|POST /api/assignments`, `GET|PATCH|DELETE /api/assignments/:id`, and `POST /api/assistant`. Keep the browser independent from provider credentials and internal service implementation:

- **Web client:** authenticated screens, editor, checklist, search results, and accessible loading/error/empty states.
- **Node API:** the prototype handles local JSON persistence and basic assignment routes. Production still requires authentication, ownership checks, robust schema validation, migrations, and rate limits for expensive operations.
- **AI service:** versioned instruction parsing and structured analysis responses. Return evidence and uncertainty, not an implied grade.
- **Document service:** file validation, page-aware text extraction/chunking, processing state, and keyword/semantic retrieval. Preserve file and page metadata in every result.
- **Data/storage:** PostgreSQL for users, assignments, requirements, and document metadata; private object storage for originals; pgvector only when semantic retrieval is implemented.

An initial HTTP contract can mirror the proposal: `POST /assignments`, `GET /assignments/:id`, `PATCH /assignments/:id`, `POST /assignments/:id/requirements/extract`, `PUT /assignments/:id/requirements`, `PUT /assignments/:id/draft`, `POST /documents`, `GET /documents/:id/search?q=...`, and `POST /assignments/:id/analyze`. Validate every request and check resource ownership server-side. Never put provider credentials in browser code.

## Reliability and safety

- Label automated statuses as evidence-based suggestions, not grades.
- Allow editing/removing extracted requirements, and retain user control over the draft.
- Keep retrieved source passages inspectable with their originating file and page.
- Do not execute uploaded files. Validate size and content type, and use private storage and signed URLs in a hosted version.
- Do not treat heuristic keyword hits as proof that an idea is correctly explained.
- For AI-assisted versions, return structured data, uncertainty, model/version details, and visible supporting evidence.
- The local JSON backend has no authentication or multi-user access control; bind it to loopback and do not deploy it as-is.

## Verification notes

The initial browser check used the seeded chemistry draft, created a second assignment from a brief containing a word range, two concepts, and a spelled-out source count, and checked a 390 px viewport for horizontal overflow. The starter draft intentionally falls short of its length/source target, so the readiness review shows gaps. PDF extraction should also be verified with a known text-based PDF before a live demo; scanned PDF OCR is outside this base build.