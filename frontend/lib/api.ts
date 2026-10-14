import type { Assignment, AssignmentInput } from "@/types/assignment";
import type { AnalysisResult } from "@/types/analysis";
import type { DocumentRecord, ResearchResult } from "@/types/document";
import type { Requirement } from "@/types/requirement";
import { extractRequirements, makeSampleAssignment } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const API = "/api";
const STORAGE_KEY = "assignmentos-v1";

type LocalState = { assignments: Assignment[]; activeId: string; profile?: { name: string; course: string; theme: "light" | "dark" }; materials?: DocumentRecord[] };

export type UserSettings = {
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

export type CollaborationItem = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  ownerId: string;
  ownerName: string;
  collaboratorId: string;
  collaboratorName: string;
  status: string;
  createdAt: string;
};

export type CollaborationChatMessage = {
  id: string;
  collaborationId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
};

export type CollaborationDraftItem = {
  id: string;
  collaborationId: string;
  authorId: string;
  authorName: string;
  draftType: "original_owner" | "original_collaborator" | "shared_improved" | "differentiated";
  content: string;
  version: number;
  comparisonMetadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type CollaborationDetails = {
  collaboration: CollaborationItem;
  assignment: { title: string; instructions: string; requirements: Requirement[] } | null;
  chats: CollaborationChatMessage[];
  drafts: CollaborationDraftItem[];
};

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
      try {
        return await request<AnalysisResult>("/analysis", {
          method: "POST",
          body: JSON.stringify({ assignmentId: assignment.id, draft })
        });
      } catch {
        return localAnalysis(assignment, draft);
      }
    },
    async getLatest(assignmentId: string) {
      try {
        const res = await request<{ analysis: AnalysisResult | null }>(`/analysis/${encodeURIComponent(assignmentId)}`);
        return res.analysis;
      } catch {
        return null;
      }
    }
  },
  writing: {
    async complete(input: { assignmentId: string; prefixText: string; paragraphText?: string }) {
      try {
        return await request<{ suggestion: string; provider: string }>("/writing/complete", {
          method: "POST",
          body: JSON.stringify(input)
        });
      } catch {
        return { suggestion: "", provider: "none" };
      }
    },
    async draft(input: {
      assignmentId: string;
      action: string;
      selectedText?: string;
      currentDraft?: string;
      customInstruction?: string;
    }) {
      return await request<{
        generatedContent: string;
        action: string;
        wordCount: number;
        notes?: string;
      }>("/writing/draft", {
        method: "POST",
        body: JSON.stringify(input)
      });
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
      return request<{ user: { id: string; username: string; displayName: string; email: string; avatarData?: string | null; googleConnected?: boolean; authProvider?: string } }>("/auth/register", { method: "POST", body: JSON.stringify(input) });
    },
    async login(input: { username: string; password: string }) {
      return request<{ user: { id: string; username: string; displayName: string; email: string; avatarData?: string | null; googleConnected?: boolean; authProvider?: string } }>("/auth/login", { method: "POST", body: JSON.stringify(input) });
    },
    async logout() { return request<{ ok: boolean }>("/auth/logout", { method: "POST", body: JSON.stringify({}) }); },
    async me() { return request<{ user: { id: string; username: string; displayName: string; email: string; avatarData?: string | null; googleConnected?: boolean; authProvider?: string } | null }>("/auth/me"); },
    async updateProfile(input: { username: string; displayName: string; avatarData: string | null }) {
      return request<{ user: { id: string; username: string; displayName: string; email: string; avatarData?: string | null; googleConnected?: boolean; authProvider?: string } }>("/auth/profile", { method: "PATCH", body: JSON.stringify(input) });
    }
  },
  settings: {
    async get() { return request<{ settings: UserSettings }>("/settings"); },
    async update(updates: Partial<UserSettings>) { return request<{ settings: UserSettings }>("/settings", { method: "PATCH", body: JSON.stringify(updates) }); }
  },
  collaborations: {
    async list() { return (await request<{ collaborations: CollaborationItem[] }>("/collaborations")).collaborations; },
    async share(assignmentId: string, recipient: string) { return (await request<{ collaboration: CollaborationItem }>("/collaborations/share", { method: "POST", body: JSON.stringify({ assignmentId, recipient }) })).collaboration; },
    async get(id: string) { return request<CollaborationDetails>(`/collaborations/${encodeURIComponent(id)}`); },
    async chat(id: string, message: string) { return (await request<{ chat: CollaborationChatMessage }>(`/collaborations/${encodeURIComponent(id)}/chat`, { method: "POST", body: JSON.stringify({ message }) })).chat; },
    async saveDraft(id: string, content: string, draftType?: "original" | "shared_improved") {
      return request<{ draft: CollaborationDraftItem }>(`/collaborations/${encodeURIComponent(id)}/draft`, {
        method: "POST",
        body: JSON.stringify({ content, draftType })
      });
    },
    async compare(id: string) { return (await request<{ result: CollaborationDraftItem }>(`/collaborations/${encodeURIComponent(id)}/compare`, { method: "POST" })).result; },
    async differentiate(id: string) { return (await request<{ result: CollaborationDraftItem }>(`/collaborations/${encodeURIComponent(id)}/differentiate`, { method: "POST" })).result; },
    async applyDraft(id: string, draftId: string) { return request<{ success: boolean; assignmentId: string; draft: unknown }>(`/collaborations/${encodeURIComponent(id)}/apply`, { method: "POST", body: JSON.stringify({ draftId }) }); }
  },
  async assistant(assignmentId: string | undefined, message: string) {
    return request<{ reply: string; provider: "local" | "ai" }>("/assistant", { method: "POST", body: JSON.stringify({ ...(assignmentId ? { assignmentId } : {}), message }) });
  },
  async assistantHistory(assignmentId: string) {
    return (await request<{ history: Array<{ id: string; role: "user" | "assistant"; message: string; createdAt: string }> }>(`/assistant/history?assignmentId=${encodeURIComponent(assignmentId)}`)).history;
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
