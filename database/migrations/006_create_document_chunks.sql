CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  page_number integer NOT NULL CHECK (page_number > 0),
  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, page_number, chunk_index)
);
CREATE INDEX IF NOT EXISTS document_chunks_assignment_page_idx ON document_chunks(assignment_id, document_id, page_number);
