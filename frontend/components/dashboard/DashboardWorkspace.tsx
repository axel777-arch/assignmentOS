"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, BookOpen, CalendarDays, FileText, Search } from "lucide-react";
import { useAssignment } from "@/hooks/useAssignment";
import { useRequirements } from "@/hooks/useRequirements";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useResearch } from "@/hooks/useResearch";
import { api } from "@/lib/api";
import { countWords } from "@/lib/utils";
import { AssignmentEditor } from "@/components/editor/AssignmentEditor";
import { RequirementsPanel } from "@/components/requirements/RequirementsPanel";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { SearchBar } from "@/components/research/SearchBar";
import { SearchResults } from "@/components/research/SearchResults";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { Requirement } from "@/types/requirement";

export function DashboardWorkspace({ assignmentId, current = "Overview" }: { assignmentId?: string; current?: string }) {
  const { assignment, assignments, loading, error, create, update } = useAssignment(assignmentId);
  const { requirements, setRequirements, add, remove } = useRequirements();
  const { result, loading: analyzing, analyze } = useAnalysis();
  const [draft, setDraft] = useState(""); const [query, setQuery] = useState(""); const [uploading, setUploading] = useState(false); const [uploadMessage, setUploadMessage] = useState(""); const [assistantAssignment, setAssistantAssignment] = useState<typeof assignment>(null);
  const research = useResearch(assignment?.id || "");
  const requirementKey = JSON.stringify(requirements.map(({ id, text, kind }) => [id, text, kind]));

  useEffect(() => { if (!assignment) return; setDraft(assignment.draft || ""); setRequirements(assignment.requirements || []); setAssistantAssignment(assignment); }, [assignment?.id, setRequirements]);
  useEffect(() => {
    if (!assignment || !assistantAssignment || assistantAssignment.id !== assignment.id) return;
    const timer = window.setTimeout(() => { void update({ draft, requirements }).catch(() => undefined); }, 500);
    return () => window.clearTimeout(timer);
  }, [draft, requirements, assignment?.id, assistantAssignment?.id, update]);
  useEffect(() => {
    if (!assignment || !assistantAssignment || assistantAssignment.id !== assignment.id || !draft.trim()) return;
    const timer = window.setTimeout(() => {
      void analyze({ ...assignment, requirements }, draft).then((analysis) => {
        setRequirements((current) => {
          let changed = false;
          const next = current.map((requirement) => {
            const status = analysis.items.find((item) => item.requirementId === requirement.id)?.status;
            if (!status || status === requirement.status) return requirement;
            changed = true;
            return { ...requirement, status: status as Requirement["status"] };
          });
          return changed ? next : current;
        });
      }).catch(() => undefined);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [assignment?.id, assistantAssignment?.id, draft, requirementKey, analyze, setRequirements]);

  if (loading) return <div className="loading-screen"><Spinner label="Loading workspace" /></div>;
  if (error && !assignment) return <main className="standalone-page"><p>{error}</p></main>;
  if (!assignment) return <main className="standalone-page"><p>No assignment found.</p></main>;

  const activeAssignment = assignment;
  const words = countWords(draft);
  async function handleCreate(input: Parameters<typeof create>[0]) { const next = await create(input); window.location.href = `/assignments/${(next as { id: string }).id}/editor`; }
  async function handleRequirements(next: Requirement[]) { setRequirements(next); await update({ requirements: next }); }
  async function upload(file?: File) {
    if (!file || !assignment) return;
    if (file.type !== "application/pdf" || file.size > 20 * 1024 * 1024) { setUploadMessage("Choose a PDF under 20 MB."); return; }
    setUploading(true); setUploadMessage("");
    try { const response = await api.documents.upload(assignment.id, file); setUploadMessage(`${response.document.name} · ${response.document.pages} pages indexed`); }
    catch (cause) { setUploadMessage(cause instanceof Error ? cause.message : "PDF processing is unavailable."); }
    finally { setUploading(false); }
  }
  function exportDraft() { const blob = new Blob([`${activeAssignment.title}\n\n${draft.replace(/<[^>]*>/g, " ")}\n`], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "assignment-draft.txt"; anchor.click(); URL.revokeObjectURL(url); }

  return <div className="app-shell"><WorkspaceSidebar current={current} /><main className="main"><header className="topbar"><div className="crumb">Workspace <span>/</span> <strong>{current}</strong></div><div className="top-actions"><span className="today">{new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span><Link href="/assignments/new" className="button button-primary"><span>＋</span> New assignment</Link></div></header>
    <section className="page-heading"><div><div className="eyebrow">YOUR ACADEMIC WORKSPACE</div><h1>{current === "Overview" ? "Make progress, not tabs." : current}</h1><p className="subtitle">One calm place for the brief, your writing, and what still needs attention.</p></div><Button onClick={exportDraft}><ArrowDownToLine size={14} /> Export draft</Button></section>
    {current === "Overview" && <section className="progress-strip"><div><FileText size={16} /><span><strong>{assignments.length}</strong><small>Assignments</small></span></div><div><BookOpen size={16} /><span><strong>{words.toLocaleString()}</strong><small>Draft words</small></span></div><div><CalendarDays size={16} /><span><strong>{assignment.due || "Open"}</strong><small>Next deadline</small></span></div></section>}
    <div className="assignment-banner"><div><div className="eyebrow">{assignment.subject || assignment.course}</div><h2>{assignment.title}</h2><div className="assignment-meta"><span>{assignment.course}</span><span>{assignment.minWords && assignment.maxWords ? `${assignment.minWords.toLocaleString()}–${assignment.maxWords.toLocaleString()} words` : "Open length"}</span><span>{assignment.sourceTarget ? `${assignment.sourceTarget} sources` : "Sources as needed"}</span></div></div><span className="due-pill">{assignment.due ? `DUE ${assignment.due}` : "NO DEADLINE"}</span></div>
    <div className="workspace-grid"><div className="center-column"><AssignmentEditor content={draft} target={assignment.targetWords} onChange={setDraft} /><RequirementsPanel requirements={requirements} onChange={(id, text) => setRequirements((items) => items.map((item) => item.id === id ? { ...item, text } : item))} onStatusChange={(id, status) => setRequirements((items) => items.map((item) => item.id === id ? { ...item, status } : item))} onAdd={add} onDelete={(id) => remove(id)} /><div className="requirement-save"><Button variant="quiet" onClick={() => void handleRequirements(requirements)}>Save checklist</Button></div></div>
      <aside className="right-column"><AnalysisPanel result={result} loading={analyzing} onAnalyze={() => void analyze({ ...assignment, requirements }, draft)} />
        <section className="panel materials-panel" id="materials"><header className="panel-heading"><h2>Course materials</h2><span className="panel-kicker">PDF LIBRARY</span></header><div className="materials-content"><label className="upload-drop"><span className="upload-icon">↑</span><span><strong>{uploading ? "Reading PDF…" : "Add a course PDF"}</strong><small>Text-based PDFs, up to 20 MB</small></span><input type="file" accept="application/pdf,.pdf" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>{uploadMessage && <p className="upload-message">{uploadMessage}</p>}<SearchBar loading={research.loading} onSearch={(value) => { setQuery(value); void research.search(value); }} />{query && <SearchResults results={research.results} />}</div></section>
      </aside></div>
    <section id="timeline" className="workspace-footer"><span><CalendarDays size={15} /> Next deadline: {assignment.due || "Set a date in assignment settings"}</span><Link href={`/assignments/${assignment.id}`} className="inline-link">Assignment details <ArrowUpRight size={14} /></Link></section>
  </main></div>;
}
