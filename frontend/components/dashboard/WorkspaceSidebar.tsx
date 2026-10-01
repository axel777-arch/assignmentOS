"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Home, ImagePlus, Moon, Sun, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { signOut } from "@/lib/auth";
import type { Profile } from "@/types/document";

const initialProfile: Profile = { name: "Student", course: "Student workspace", username: "student", avatarData: null, theme: "light" };
const links = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/assignments", label: "Assignments", icon: FileText },
];
const MAX_AVATAR_BYTES = 512 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function WorkspaceSidebar({ current = "Overview" }: { current?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(initialProfile.username || "student");
  const [displayName, setDisplayName] = useState(initialProfile.name);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [profileError, setProfileError] = useState("");
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCollapsed(localStorage.getItem("assignmentos-sidebar-collapsed") === "true");
    try {
      const saved = JSON.parse(localStorage.getItem("assignmentos-profile") || "null");
      if (saved) {
        const normalized = { ...initialProfile, ...saved, theme: saved.theme === "dark" ? "dark" as const : "light" as const };
        setProfile(normalized);
        setUsername(normalized.username || "student");
        setDisplayName(normalized.name || "Student");
        setAvatarData(normalized.avatarData || null);
        document.documentElement.dataset.theme = normalized.theme;
      }
    } catch { /* Keep the default profile. */ }

    let active = true;
    void api.auth.me().then(({ user }) => {
      if (!active || !user) return;
      setProfile((currentProfile) => ({
        ...currentProfile,
        name: user.displayName || user.username,
        username: user.username,
        course: `@${user.username}`,
        avatarData: user.avatarData || null
      }));
      setUsername(user.username);
      setDisplayName(user.displayName || user.username);
      setAvatarData(user.avatarData || null);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;
    function closeOnOutside(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileMenuOpen]);

  function toggleTheme() {
    const theme: Profile["theme"] = profile.theme === "dark" ? "light" : "dark";
    const next = { ...profile, theme };
    setProfile(next);
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("assignmentos-profile", JSON.stringify(next));
  }

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("assignmentos-sidebar-collapsed", String(next));
  }

  function startEditing() {
    setUsername(profile.username || "student");
    setDisplayName(profile.name || "Student");
    setAvatarData(profile.avatarData || null);
    setProfileError("");
    setEditing(true);
    setProfileMenuOpen(false);
  }

  async function chooseAvatar(file?: File) {
    setProfileError("");
    if (!file) return;
    if (!IMAGE_TYPES.has(file.type)) { setProfileError("Choose a PNG, JPEG, or WebP image."); return; }
    if (file.size > MAX_AVATAR_BYTES) { setProfileError("Profile images must be 512 KB or smaller."); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarData(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setProfileError("Could not read that image. Try another file.");
    reader.readAsDataURL(file);
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileError("");
    try {
      const result = await api.auth.updateProfile({ username: username.trim(), displayName: displayName.trim(), avatarData });
      const user = result.user;
      const next = { ...profile, username: user.username, name: user.displayName, course: `@${user.username}`, avatarData: user.avatarData || null };
      setProfile(next);
      localStorage.setItem("assignmentos-profile", JSON.stringify(next));
      setEditing(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save your profile.");
    }
  }

  async function logout() {
    setProfileMenuOpen(false);
    try { await signOut(); }
    finally {
      localStorage.removeItem("assignmentos-profile");
      window.location.href = "/login";
    }
  }

  const initials = profile.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const activeLink = current === "Overview" ? "Overview" : "Assignments";

  return <>
    <button className="mobile-sidebar-trigger" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><ChevronRight size={17} /></button>
    <aside className={`workspace-sidebar ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}>
      <div className="brand"><span className="brand-mark">A</span>{!collapsed && <span>assignmentOS<small>YOUR WORK, IN FOCUS</small></span>}<button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={16} /></button></div>
      <div className="sidebar-label">Workspace</div>
      <nav className="sidebar-nav">{links.map(({ href, label, icon: Icon }) => <Link key={label} href={href} onClick={() => setMobileOpen(false)} className={`nav-item ${activeLink === label ? "active" : ""}`} title={collapsed ? label : undefined}><Icon size={17} /><span>{label}</span></Link>)}</nav>
      <div className="sidebar-bottom">
        <Button variant="quiet" onClick={toggleTheme}><span className="nav-icon">{profile.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</span><span>{profile.theme === "dark" ? "Light mode" : "Dark mode"}</span></Button>
        <div className="profile-menu-wrap" ref={profileMenuRef}>
          <button className="profile-button" aria-haspopup="menu" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((open) => !open)}>
            <span className="avatar">{profile.avatarData ? <img src={profile.avatarData} alt="" /> : initials || <UserRound size={15} />}</span>
            {!collapsed && <span className="profile-copy"><strong>{profile.name}</strong><small>@{profile.username || "student"}</small></span>}
          </button>
          {profileMenuOpen && <div className="profile-menu" role="menu"><div className="profile-menu-heading"><strong>{profile.name}</strong><small>@{profile.username || "student"}</small></div><button role="menuitem" onClick={startEditing}>Edit profile</button><button role="menuitem" onClick={() => void logout()}>Log out</button></div>}
        </div>
        <button className="collapse-button" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}<span>{collapsed ? "Expand" : "Collapse"}</span></button>
      </div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <Modal title="Edit profile" open={editing} onClose={() => setEditing(false)}>
      <form className="profile-form" onSubmit={saveProfile}>
        <div className="profile-avatar-editor"><span className="avatar avatar-large">{avatarData ? <img src={avatarData} alt="Profile preview" /> : initials || <UserRound size={22} />}</span><label className="button" htmlFor="profile-picture"><ImagePlus size={15} /> Change photo</label><input id="profile-picture" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { void chooseAvatar(event.target.files?.[0]); event.currentTarget.value = ""; }} /></div>
        <Input id="profile-display-name" label="Name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} required />
        <Input id="profile-username" label="Username" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={32} pattern="[a-zA-Z0-9._-]+" required />
        {profileError && <p className="field-error" role="alert">{profileError}</p>}
        <Button variant="primary" type="submit">Save profile</Button>
      </form>
    </Modal>
  </>;
}
