import { BookOpen } from "lucide-react";
import type { ResearchResult } from "@/types/document";

export function SourceCard({ result }: { result: ResearchResult }) {
  return <article className="source-card"><div className="source-meta"><BookOpen size={14} /><strong>{result.documentName}</strong><span>PAGE {result.page}</span></div><p>{result.excerpt}</p></article>;
}
