"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Globe,
  Lock,
  LogOut,
  Moon,
  Palette,
  Shield,
  Sliders,
  Sparkles,
  Type,
  User
} from "lucide-react";
import { api, type UserSettings } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function SettingsView() {
  const { theme, changeTheme, fontSize, changeFontSize } = useTheme();
  const [user, setUser] = useState<{ id: string; username: string; displayName: string; email: string; googleConnected?: boolean; authProvider?: string } | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "theme" | "ai" | "editor" | "privacy">("profile");

  // Profile Form state
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  // Preference Form state
  const [appearance, setAppearance] = useState("system");
  const [aiVerbosity, setAiVerbosity] = useState("balanced");
  const [autosaveInterval, setAutosaveInterval] = useState(500);
  const [collaborationVisibility, setCollaborationVisibility] = useState("everyone");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.auth.me(), api.settings.get()])
      .then(([uRes, sRes]) => {
        if (!isMounted) return;
        if (uRes.user) {
          setUser(uRes.user);
          setDisplayName(uRes.user.displayName);
          setUsername(uRes.user.username);
        }
        if (sRes.settings) {
          setSettings(sRes.settings);
          setAppearance(sRes.settings.appearance);
          setAiVerbosity(sRes.settings.aiVerbosity);
          setAutosaveInterval(sRes.settings.autosaveInterval);
          setCollaborationVisibility(sRes.settings.collaborationVisibility);
          setNotificationsEnabled(sRes.settings.notificationsEnabled);
        }
      })
      .catch((err) => setError(err.message || "Failed to load settings."))
      .finally(() => setLoading(false));

    return () => { isMounted = false; };
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await api.auth.updateProfile({ displayName, username, avatarData: null });
      setUser(res.user);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePreferences() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await api.settings.update({
        theme,
        appearance,
        aiVerbosity,
        fontSize,
        autosaveInterval,
        collaborationVisibility,
        notificationsEnabled
      });
      setSettings(res.settings);
      setMessage("Settings updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await api.auth.logout();
    window.location.href = "/login";
  }

  const themes = [
    { id: "midnight", name: "Midnight Focus", type: "Dark Slate & Indigo", colors: ["#0f172a", "#1e293b", "#6366f1"] },
    { id: "paper", name: "Academic Paper", type: "Parchment Light", colors: ["#f7f5ef", "#ffffff", "#2d5a27"] },
    { id: "emerald", name: "Emerald Oasis", type: "Deep Dark Teal", colors: ["#091a16", "#122823", "#10b981"] },
    { id: "nord", name: "Nordic Frost", type: "Arctic Dark Blue", colors: ["#2e3440", "#3b4252", "#88c0d0"] },
    { id: "sunset", name: "Sunset Amber", type: "Warm Dark Coral", colors: ["#1c1917", "#292524", "#f97316"] },
    { id: "dracula", name: "Dracula Purple", type: "Rich Purple & Pink", colors: ["#282a36", "#44475a", "#bd93f9"] }
  ];

  if (loading) {
    return (
      <div className="app-shell">
        <WorkspaceSidebar current="Settings" />
        <main className="main"><div className="loading-screen"><Spinner label="Loading settings…" /></div></main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <WorkspaceSidebar current="Settings" />
      <main className="main">
        <header className="topbar">
          <div className="crumb">Workspace <span>/</span> <strong>Settings</strong></div>
          <div className="top-actions">
            <span className="today">{new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">PREFERENCES & ACCOUNT</div>
            <h1>Application Settings</h1>
            <p className="subtitle">Manage your profile, theme, AI defaults, and workspace options.</p>
          </div>
        </section>

        {message && <div className="collab-alert success"><CheckCircle2 size={15} /> {message}</div>}
        {error && <div className="collab-alert error"><Shield size={15} /> {error}</div>}

        <div className="settings-container">
          <nav className="settings-tabs">
            <button className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
              <User size={14} /> Profile & Account
            </button>
            <button className={`settings-tab-btn ${activeTab === "theme" ? "active" : ""}`} onClick={() => setActiveTab("theme")}>
              <Palette size={14} /> Themes & Appearance
            </button>
            <button className={`settings-tab-btn ${activeTab === "ai" ? "active" : ""}`} onClick={() => setActiveTab("ai")}>
              <Sparkles size={14} /> AI Assistant Preferences
            </button>
            <button className={`settings-tab-btn ${activeTab === "editor" ? "active" : ""}`} onClick={() => setActiveTab("editor")}>
              <Sliders size={14} /> Editor & Workspace
            </button>
            <button className={`settings-tab-btn ${activeTab === "privacy" ? "active" : ""}`} onClick={() => setActiveTab("privacy")}>
              <Lock size={14} /> Privacy & Collaboration
            </button>
          </nav>

          {/* TAB 1: Profile & Account */}
          {activeTab === "profile" && (
            <div className="settings-card">
              <h3>Profile Information</h3>
              <form onSubmit={handleSaveProfile} className="profile-form">
                <div className="field">
                  <label className="field-label">Display Name</label>
                  <input className="text-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                </div>

                <div className="field">
                  <label className="field-label">Username</label>
                  <input className="text-input" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>

                <div className="field">
                  <label className="field-label">Email Address</label>
                  <input className="text-input" value={user?.email || ""} disabled readOnly style={{ opacity: 0.7 }} />
                </div>

                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving Profile…" : "Save Profile Changes"}
                </Button>
              </form>

              <hr style={{ borderColor: "var(--line)", margin: "10px 0" }} />

              <div>
                <h3>Account & Authentication Status</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                  <Globe size={16} />
                  <span>Google Connection Status:</span>
                  <span className={user?.googleConnected ? "badge badge-good" : "badge"}>
                    {user?.googleConnected ? "Connected with Google" : "Not Linked to Google"}
                  </span>
                </div>
                {!user?.googleConnected && (
                  <p className="muted-copy" style={{ marginTop: "6px" }}>
                    Sign in using Google OAuth on the login screen to automatically link your Google account.
                  </p>
                )}
              </div>

              <hr style={{ borderColor: "var(--line)", margin: "10px 0" }} />

              <div>
                <Button variant="quiet" onClick={handleLogout} style={{ color: "var(--coral)" }}>
                  <LogOut size={15} /> Sign Out of AssignmentOS
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: Themes & Appearance */}
          {activeTab === "theme" && (
            <div className="settings-card">
              <div>
                <h3>Select Application Theme (6 Curated Themes)</h3>
                <p className="muted-copy">Themes consistently change colors, panels, and borders across the entire app.</p>
                <div className="theme-grid">
                  {themes.map((t) => (
                    <div
                      key={t.id}
                      className={`theme-option-card ${theme === t.id ? "selected" : ""}`}
                      onClick={() => changeTheme(t.id)}
                    >
                      <strong>{t.name}</strong>
                      <small style={{ display: "block", color: "var(--muted)", fontSize: "9px" }}>{t.type}</small>
                      <div className="theme-preview-dots">
                        {t.colors.map((c, i) => (
                          <div key={i} className="theme-dot" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr style={{ borderColor: "var(--line)", margin: "10px 0" }} />

              <div className="field">
                <label className="field-label"><Moon size={13} /> Appearance Mode</label>
                <select className="text-input" value={appearance} onChange={(e) => setAppearance(e.target.value)}>
                  <option value="system">System Default</option>
                  <option value="dark">Dark Mode Override</option>
                  <option value="light">Light Mode Override</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label"><Type size={13} /> Interface Font Size</label>
                <select className="text-input" value={fontSize} onChange={(e) => changeFontSize(e.target.value)}>
                  <option value="small">Small (13px)</option>
                  <option value="medium">Medium Default (15px)</option>
                  <option value="large">Large (17px)</option>
                </select>
              </div>

              <Button onClick={handleSavePreferences} variant="primary" disabled={saving}>
                {saving ? "Saving Preferences…" : "Save Theme Preferences"}
              </Button>
            </div>
          )}

          {/* TAB 3: AI Assistant Preferences */}
          {activeTab === "ai" && (
            <div className="settings-card">
              <h3><Sparkles size={16} /> AI Coach & Response Settings</h3>
              <p className="muted-copy">Control how the persistent assignment chatbot formats its suggestions.</p>

              <div className="field">
                <label className="field-label">AI Response Verbosity</label>
                <select className="text-input" value={aiVerbosity} onChange={(e) => setAiVerbosity(e.target.value)}>
                  <option value="concise">Concise & Direct (Brief bullet points)</option>
                  <option value="balanced">Balanced (Recommended - Explanation + Next step)</option>
                  <option value="detailed">Detailed (In-depth analysis & guidance)</option>
                </select>
              </div>

              <div style={{ padding: "14px", border: "1px solid var(--line)", borderRadius: "6px", background: "var(--paper)" }}>
                <strong>Active Model Provider</strong>
                <p className="muted-copy" style={{ margin: "4px 0 0" }}>
                  AssignmentOS reuses local Ollama Llama 3.2 3B by default with deterministic fallback. Hosted provider key is optional in environment variables.
                </p>
              </div>

              <Button onClick={handleSavePreferences} variant="primary" disabled={saving}>
                {saving ? "Saving Preferences…" : "Save AI Preferences"}
              </Button>
            </div>
          )}

          {/* TAB 4: Editor & Workspace */}
          {activeTab === "editor" && (
            <div className="settings-card">
              <h3>Editor & Workspace Options</h3>

              <div className="field">
                <label className="field-label">Autosave Delay (milliseconds)</label>
                <select className="text-input" value={autosaveInterval} onChange={(e) => setAutosaveInterval(Number(e.target.value))}>
                  <option value={300}>Fast (300 ms)</option>
                  <option value={500}>Default (500 ms)</option>
                  <option value={1000}>Relaxed (1000 ms)</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label"><Bell size={13} /> Readiness Analysis Notifications</label>
                <select
                  className="text-input"
                  value={notificationsEnabled ? "true" : "false"}
                  onChange={(e) => setNotificationsEnabled(e.target.value === "true")}
                >
                  <option value="true">Enabled (Debounced status checklist updates)</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <Button onClick={handleSavePreferences} variant="primary" disabled={saving}>
                {saving ? "Saving Preferences…" : "Save Editor Preferences"}
              </Button>
            </div>
          )}

          {/* TAB 5: Privacy & Collaboration */}
          {activeTab === "privacy" && (
            <div className="settings-card">
              <h3><Lock size={16} /> Privacy & Collaboration Visibility</h3>
              <p className="muted-copy">Control who can send you student collaboration requests for assignments.</p>

              <div className="field">
                <label className="field-label">Collaboration Invites</label>
                <select className="text-input" value={collaborationVisibility} onChange={(e) => setCollaborationVisibility(e.target.value)}>
                  <option value="everyone">Allow any registered student to share an assignment with me</option>
                  <option value="disabled">Disable collaboration invitations</option>
                </select>
              </div>

              <div style={{ padding: "14px", border: "1px solid var(--line)", borderRadius: "6px", background: "var(--paper)" }}>
                <strong>Backend Authorization Enforcement</strong>
                <p className="muted-copy" style={{ margin: "4px 0 0" }}>
                  All assignment and draft data is protected at the API boundary. Other students cannot access your assignments unless explicitly shared through permission-based collaboration.
                </p>
              </div>

              <Button onClick={handleSavePreferences} variant="primary" disabled={saving}>
                {saving ? "Saving Preferences…" : "Save Privacy Settings"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
