import type { Assignment, AssignmentInput } from "@/types/assignment";
import type { AnalysisResult } from "@/types/analysis";
import type { DocumentRecord, ResearchResult } from "@/types/document";
import type { Requirement } from "@/types/requirement";
import { extractRequirements, makeSampleAssignment } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const API = "/api";
const STORAGE_KEY = "assignmentos-v1";

type LocalState = { assignments: Assignment[]; activeId: string; profile?: { name: string; course: string; theme: "light" | "dark" }; materials?: DocumentRecord[] };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const supabase = createSupabaseBrowserClient();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }
  const response = await fetch(`${API}${path}`, { ...init, headers, credentials: "same-origin" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || payload.error || `API request failed (${response.status}).`);
  return (payload.data ?? payload) as T;
}

function localState(): LocalState {
  if (typeof window === "undefined") return { assignments: [], activeId: "" };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as LocalState | null;
    if (saved?.assignments?.length) return saved;
  } catch { /* Use demo state when local storage is invalid. */ }
  const sample = makeSampleAssignment();
  return { assignments: [sample], activeId: sample.id, profile: { name: "Student", course: "Student workspace", theme: "light" }, materials: [] };
}

function saveLocal(state: LocalState) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const api = {
  assignments: {
    async list() {
      try { return (await request<{ assignments: Assignment[] }>("/assignments")).assignments; }
      catch { return localState().assignments; }
    },
    async get(id: string) {
      try { return (await request<{ assignment: Assignment }>(`/assignments/${encodeURIComponent(id)}`)).assignment; }
      catch { return localState().assignments.find((item) => item.id === id) ?? localState().assignments[0] ?? null; }
    },
    async create(input: AssignmentInput) {
      const requirements = await api.requirements.extract(input.instructions, input.targetWords);
      try { return (await request<{ assignment: Assignment }>("/assignments", { method: "POST", body: JSON.stringify({ ...input, requirements, draft: "" }) })).assignment; }
      catch {
        const state = localState();
        const assignment = { ...input, id: `assignment-${crypto.randomUUID()}`, requirements, draft: "" };
        state.assignments.unshift(assignment); state.activeId = assignment.id; saveLocal(state); return assignment;
      }
    },
    async update(id: string, updates: Partial<Assignment>) {
      try { return (await request<{ assignment: Assignment }>(`/assignments/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(updates) })).assignment; }
      catch {
        const state = localState();
        const index = state.assignments.findIndex((item) => item.id === id);
        if (index < 0) throw new Error("Assignment not found.");
        state.assignments[index] = { ...state.assignments[index], ...updates }; saveLocal(state); return state.assignments[index];
      }
    },
    async remove(id: string) { return request<{ ok: boolean }>(`/assignments/${encodeURIComponent(id)}`, { method: "DELETE" }); },
    async saveDraft(id: string, draft: string) { return this.update(id, { draft }); },
    async saveRequirements(id: string, requirements: Requirement[]) { return this.update(id, { requirements }); }
  },
  requirements: {
    async extract(brief: string, targetWords = 0) {
      try { return (await request<{ requirements: Requirement[] }>("/requirements/extract", { method: "POST", body: JSON.stringify({ brief, targetWords }) })).requirements; }
      catch { return extractRequirements(brief, targetWords); }
    }
  },
  analysis: {
    async run(assignment: Assignment, draft: string) {
      try { return await request<AnalysisResult>("/analysis", { method: "POST", body: JSON.stringify({ assignmentId: assignment.id, requirements: assignment.requirements, draft }) }); }
      catch { return localAnalysis(assignment, draft); }
    }
  },
  documents: {
    async upload(assignmentId: string, file: File) {
      const form = new FormData(); form.set("file", file); form.set("assignmentId", assignmentId);
      return request<{ document: DocumentRecord }>("/documents", { method: "POST", body: form });
    },
    async search(assignmentId: string, query: string) {
      try { return (await request<{ results: ResearchResult[] }>("/research", { method: "POST", body: JSON.stringify({ assignmentId, query }) })).results; }
      catch { return [] as ResearchResult[]; }
    }
  },
  auth: {
    async register(input: { username: string; password: string; displayName: string; email?: string }) {
      return request<{ user: { id: string; username: string; displayName: string; email: string; avatarData?: string | null } }>("/auth/register", { method: "POST", body: JSON.stringify(input) });
    },
    async login(input: { username: string; password: string }) {
      return request<{ user: { id: string; username: string; displayName: string; email: string; avatarData?: string | null } }>("/auth/login", { method: "POST", body: JSON.stringify(input) });
    },
    async logout() { return request<{ ok: boolean }>("/auth/logout", { method: "POST", body: JSON.stringify({}) }); },
    async me() { return request<{ user: { id: string; username: string; displayName: string; email: string; avatarData?: string | null } | null }>("/auth/me"); },
    async updateProfile(input: { username: string; displayName: string; avatarData: string | null }) {
      return request<{ user: { id: string; username: string; displayName: string; email: string; avatarData?: string | null } }>("/auth/profile", { method: "PATCH", body: JSON.stringify(input) });
    }
  },
  async assistant(assignmentId: string | undefined, message: string) {
    return request<{ reply: string; provider: "local" | "ai" }>("/assistant", { method: "POST", body: JSON.stringify({ ...(assignmentId ? { assignmentId } : {}), message }) });
  }
};

function localAnalysis(assignment: Assignment, draft: string): AnalysisResult {
  const text = draft.replace(/<[^>]*>/g, " ").toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const items = assignment.requirements.map((requirement) => {
    let status: Requirement["status"] = "missing";
    if (requirement.kind === "length") status = words >= assignment.minWords && words <= assignment.maxWords ? "met" : words ? "partial" : "missing";
    else if (requirement.kind === "sources") status = /references|works cited|bibliography/i.test(text) ? "partial" : "missing";
    else status = requirement.text.toLowerCase().split(/\W+/).filter((word) => word.length > 4).some((word) => text.includes(word)) ? "met" : "missing";
    return { requirementId: requirement.id, status, evidence: "Keyword and structure check; review the draft manually.", suggestion: status === "met" ? "Check that this is explained clearly and supported." : `Review: ${requirement.text}` };
  });
  const met = items.filter((item) => item.status === "met").length;
  return { score: items.length ? Math.round(met / items.length * 100) : 0, summary: `${met} of ${items.length} requirements matched by the local check.`, items, disclaimer: "This is a heuristic review, not a grade or proof of semantic coverage." };
}
