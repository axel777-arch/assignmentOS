CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  result jsonb NOT NULL,
  disclaimer text NOT NULL,
  model_version text NOT NULL DEFAULT 'heuristic-v1',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analyses_assignment_created_idx ON analyses(assignment_id, created_at DESC);
