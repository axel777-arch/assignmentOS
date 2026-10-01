CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type = 'application/pdf'),
  page_count integer NOT NULL DEFAULT 0 CHECK (page_count >= 0),
  storage_key text,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','ready','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documents_assignment_idx ON documents(assignment_id, created_at DESC);
