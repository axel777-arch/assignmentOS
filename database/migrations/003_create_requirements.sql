CREATE TABLE IF NOT EXISTS requirements (
  id text PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(text) BETWEEN 1 AND 1000),
  kind text NOT NULL CHECK (kind IN ('concept','section','length','sources','deadline')),
  status text NOT NULL DEFAULT 'not_checked' CHECK (status IN ('not_checked','met','partial','missing')),
  evidence text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS requirements_assignment_position_idx ON requirements(assignment_id, position);
