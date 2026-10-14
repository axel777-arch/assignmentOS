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
