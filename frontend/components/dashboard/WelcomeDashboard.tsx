"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, FilePlus2, Settings } from "lucide-react";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import { api } from "@/lib/api";

export function WelcomeDashboard() {
  const [name, setName] = useState("Student");
  useEffect(() => {
    try { const profile = JSON.parse(localStorage.getItem("assignmentos-profile") || "null"); if (profile?.name) setName(profile.name); } catch { /* Keep the default greeting. */ }
    void api.auth.me().then(({ user }) => { if (user?.displayName) setName(user.displayName); }).catch(() => undefined);
  }, []);
  return <div className="app-shell"><WorkspaceSidebar current="Overview" /><main className="main welcome-main"><header className="topbar"><div className="crumb">Workspace / <strong>Home</strong></div><div className="top-actions"><span className="today">{new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span></div></header><section className="welcome-hero"><div className="eyebrow">A SPACE FOR YOUR NEXT IDEA</div><h1>Welcome, {name}.</h1><p>Start with the brief. Build your understanding. Make the work yours.</p><div className="welcome-actions"><Link className="button button-primary" href="/assignments">Go to assignments <ArrowRight size={15} /></Link><Link className="button" href="/assignments/new"><FilePlus2 size={15} /> Create an assignment</Link></div></section><nav className="welcome-shortcuts" aria-label="Workspace destinations"><Link href="/assignments"><span><BookOpen size={18} /></span><strong>Assignments</strong><small>Open your briefs and drafts</small><ArrowRight size={15} /></Link><Link href="/assignments/new"><span><FilePlus2 size={18} /></span><strong>New workspace</strong><small>Paste a brief to get started</small><ArrowRight size={15} /></Link><Link href="/settings"><span><Settings size={18} /></span><strong>Preferences</strong><small>Update your profile and theme</small><ArrowRight size={15} /></Link></nav></main></div>;
}
