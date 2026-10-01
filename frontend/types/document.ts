export type DocumentRecord = {
  id: string;
  name: string;
  pages: number;
  status: "processing" | "ready" | "failed";
};

export type ResearchResult = {
  documentId: string;
  documentName: string;
  page: number;
  excerpt: string;
  score: number;
};

export type Profile = { name: string; course: string; theme: "light" | "dark"; username?: string; avatarData?: string | null };
