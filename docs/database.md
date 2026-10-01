# Database

The local database is PostgreSQL 16 with the pgvector extension enabled. Apply the ordered SQL files under `database/migrations/`; the backend runner records each applied filename in `schema_migrations` and wraps each migration in a transaction.

## Tables

- `users`: student identity with a unique case-insensitive username, optional email, display name, bcrypt password hash, and a size-limited avatar data URL.
- `assignments`: owner, instructions, course, deadline, and analysis targets.
- `requirements`: editable structured criteria and current status/evidence.
- `drafts`: rich-text HTML content and version counter.
- `documents`: uploaded source metadata and processing state.
- `document_chunks`: page/chunk text with optional `vector(1536)` embedding column.
- `analyses`: structured results, disclaimer, and model/version metadata.

Assignments cascade-delete their requirements, drafts, documents, chunks, and analyses. List queries are indexed by owner and update time; source results retain document ID and page number.

## Migrations and seed

```powershell
npm --prefix backend run migrate
npm --prefix backend run seed
```

The canonical reference schema is `database/schema.sql`; incremental changes belong in a new ordered migration. `database/seed/demo_data.sql` is a portable SQL fixture. Do not put real student data in demo seeds.

`embedding vector(1536)` is reserved for future semantic retrieval. The current document search uses stored page text and keyword matching. Choose an embedding provider/model and dimension before creating a vector index.
