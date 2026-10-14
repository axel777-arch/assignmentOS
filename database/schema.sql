CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY, email text UNIQUE, username text, password_hash text, display_name text NOT NULL DEFAULT 'Student', avatar_data text, google_id text UNIQUE, auth_provider text NOT NULL DEFAULT 'local', last_login_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique ON users (lower(username)) WHERE username IS NOT NULL;
CREATE TABLE IF NOT EXISTS assignments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, title text NOT NULL, course text NOT NULL DEFAULT '', subject text NOT NULL DEFAULT '', due date, instructions text NOT NULL DEFAULT '', target_words integer NOT NULL DEFAULT 0, min_words integer NOT NULL DEFAULT 0, max_words integer NOT NULL DEFAULT 0, source_target integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS requirements (id text PRIMARY KEY, assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE, text text NOT NULL, kind text NOT NULL, status text NOT NULL DEFAULT 'not_checked', evidence text, position integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS drafts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL UNIQUE REFERENCES assignments(id) ON DELETE CASCADE, content text NOT NULL DEFAULT '', version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE, owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, file_name text NOT NULL, mime_type text NOT NULL, page_count integer NOT NULL DEFAULT 0, storage_key text, status text NOT NULL DEFAULT 'processing', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS document_chunks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE, assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE, page_number integer NOT NULL, chunk_index integer NOT NULL DEFAULT 0, content text NOT NULL, embedding vector(1536), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (document_id,page_number,chunk_index));
CREATE TABLE IF NOT EXISTS analyses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE, score integer NOT NULL, result jsonb NOT NULL, disclaimer text NOT NULL, model_version text NOT NULL DEFAULT 'heuristic-v1', created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collaborator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'accepted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, collaborator_id)
);

CREATE TABLE IF NOT EXISTS collaboration_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id uuid NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collaboration_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id uuid NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  draft_type text NOT NULL,
  content text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  comparison_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'midnight',
  appearance text NOT NULL DEFAULT 'system',
  ai_verbosity text NOT NULL DEFAULT 'balanced',
  font_size text NOT NULL DEFAULT 'medium',
  autosave_interval integer NOT NULL DEFAULT 500,
  collaboration_visibility text NOT NULL DEFAULT 'everyone',
  notifications_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assistant_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistant_chats_assignment ON assistant_chats (assignment_id, created_at);
