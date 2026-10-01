"use client";

import Link from "next/link";
import { useAssignment } from "@/hooks/useAssignment";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import { AssignmentList } from "@/components/assignments/AssignmentList";
import { Button } from "@/components/ui/Button";

export default function AssignmentsPage() {
  const { assignments, loading } = useAssignment();
  return <div className="app-shell"><WorkspaceSidebar current="Assignments" /><main className="main"><header className="topbar"><div className="crumb">Workspace / <strong>Assignments</strong></div><Link className="button button-primary" href="/assignments/new">＋ New assignment</Link></header><section className="page-heading"><div><div className="eyebrow">YOUR WORK, IN FOCUS</div><h1>Assignments</h1><p className="subtitle">Keep every brief and draft together.</p></div><Button>Filter by course</Button></section>{loading ? <div className="loading-screen">Loading assignments…</div> : <AssignmentList assignments={assignments} />}</main></div>;
}
