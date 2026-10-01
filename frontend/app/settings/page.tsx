import Link from "next/link";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";

export default function SettingsPage() {
  return <div className="app-shell"><WorkspaceSidebar current="Settings" /><main className="main"><header className="topbar"><div className="crumb">Workspace / <strong>Settings</strong></div></header><section className="page-heading"><div><div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p className="subtitle">Manage your student account and workspace preferences.</p></div></section><section className="panel settings-panel"><h2>Student account</h2><p>Your username and password are managed by the AssignmentOS account service. Passwords are stored as bcrypt hashes.</p><Link className="inline-link" href="/login">Account sign-in</Link><hr /><h2>Appearance</h2><p>Use the theme toggle and profile controls in the sidebar to personalize this workspace.</p></section></main></div>;
}
