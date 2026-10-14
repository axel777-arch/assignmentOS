import { query } from "@/config/database";

export type UserSettingsRecord = {
  userId: string;
  theme: string;
  appearance: string;
  aiVerbosity: string;
  fontSize: string;
  autosaveInterval: number;
  collaborationVisibility: string;
  notificationsEnabled: boolean;
  updatedAt: string;
};

type SettingsRow = {
  user_id: string;
  theme: string;
  appearance: string;
  ai_verbosity: string;
  font_size: string;
  autosave_interval: number;
  collaboration_visibility: string;
  notifications_enabled: boolean;
  updated_at: Date;
};

export async function getUserSettings(userId: string): Promise<UserSettingsRecord> {
  const result = await query<SettingsRow>("SELECT * FROM user_settings WHERE user_id = $1 LIMIT 1", [userId]);
  if (result.rows[0]) {
    const row = result.rows[0];
    return {
      userId: row.user_id,
      theme: row.theme,
      appearance: row.appearance,
      aiVerbosity: row.ai_verbosity,
      fontSize: row.font_size,
      autosaveInterval: row.autosave_interval,
      collaborationVisibility: row.collaboration_visibility,
      notificationsEnabled: row.notifications_enabled,
      updatedAt: row.updated_at.toISOString()
    };
  }

  // Create defaults
  const insert = await query<SettingsRow>(
    `INSERT INTO user_settings (user_id, theme, appearance, ai_verbosity, font_size, autosave_interval, collaboration_visibility, notifications_enabled)
     VALUES ($1, 'midnight', 'system', 'balanced', 'medium', 500, 'everyone', true)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
     RETURNING *`,
    [userId]
  );
  const row = insert.rows[0];
  return {
    userId: row.user_id,
    theme: row.theme,
    appearance: row.appearance,
    aiVerbosity: row.ai_verbosity,
    fontSize: row.font_size,
    autosaveInterval: row.autosave_interval,
    collaborationVisibility: row.collaboration_visibility,
    notificationsEnabled: row.notifications_enabled,
    updatedAt: row.updated_at.toISOString()
  };
}

export async function updateUserSettings(userId: string, input: Partial<Omit<UserSettingsRecord, "userId" | "updatedAt">>): Promise<UserSettingsRecord> {
  const current = await getUserSettings(userId);
  const theme = input.theme ?? current.theme;
  const appearance = input.appearance ?? current.appearance;
  const aiVerbosity = input.aiVerbosity ?? current.aiVerbosity;
  const fontSize = input.fontSize ?? current.fontSize;
  const autosaveInterval = input.autosaveInterval ?? current.autosaveInterval;
  const collaborationVisibility = input.collaborationVisibility ?? current.collaborationVisibility;
  const notificationsEnabled = input.notificationsEnabled ?? current.notificationsEnabled;

  const result = await query<SettingsRow>(
    `INSERT INTO user_settings (user_id, theme, appearance, ai_verbosity, font_size, autosave_interval, collaboration_visibility, notifications_enabled, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
     ON CONFLICT (user_id) DO UPDATE SET
       theme = EXCLUDED.theme,
       appearance = EXCLUDED.appearance,
       ai_verbosity = EXCLUDED.ai_verbosity,
       font_size = EXCLUDED.font_size,
       autosave_interval = EXCLUDED.autosave_interval,
       collaboration_visibility = EXCLUDED.collaboration_visibility,
       notifications_enabled = EXCLUDED.notifications_enabled,
       updated_at = now()
     RETURNING *`,
    [userId, theme, appearance, aiVerbosity, fontSize, autosaveInterval, collaborationVisibility, notificationsEnabled]
  );

  const row = result.rows[0];
  return {
    userId: row.user_id,
    theme: row.theme,
    appearance: row.appearance,
    aiVerbosity: row.ai_verbosity,
    fontSize: row.font_size,
    autosaveInterval: row.autosave_interval,
    collaborationVisibility: row.collaboration_visibility,
    notificationsEnabled: row.notifications_enabled,
    updatedAt: row.updated_at.toISOString()
  };
}
