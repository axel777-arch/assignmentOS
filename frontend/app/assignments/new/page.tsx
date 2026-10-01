"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { CreateAssignment } from "@/components/assignments/CreateAssignment";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import { useAssignment } from "@/hooks/useAssignment";
import type { AssignmentInput } from "@/types/assignment";

export default function NewAssignmentPage() {
  const router = useRouter(); const { create } = useAssignment(); const [busy, setBusy] = useState(false);
  async function handleCreate(input: AssignmentInput) { setBusy(true); try { const assignment = await create(input); router.push(`/assignments/${assignment.id}/editor`); } finally { setBusy(false); } }
  return <div className="app-shell"><WorkspaceSidebar current="Assignments" /><main className="main"><header className="topbar"><Link className="inline-link" href="/assignments"><ChevronLeft size={15} /> All assignments</Link></header><section className="page-heading"><div><div className="eyebrow">START WITH THE BRIEF</div><h1>New assignment</h1><p className="subtitle">Extract a first checklist, then edit it to match your teacher's instructions.</p></div></section><section className="panel create-panel"><CreateAssignment onCreate={handleCreate} busy={busy} /></section></main></div>;
}
