CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  course text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  due date,
  instructions text NOT NULL DEFAULT '',
  target_words integer NOT NULL DEFAULT 0 CHECK (target_words >= 0),
  min_words integer NOT NULL DEFAULT 0 CHECK (min_words >= 0),
  max_words integer NOT NULL DEFAULT 0 CHECK (max_words >= 0),
  source_target integer NOT NULL DEFAULT 0 CHECK (source_target >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assignments_user_updated_idx ON assignments(user_id, updated_at DESC);
