import type { ResearchResult } from "@/types/document";
import { SourceCard } from "@/components/research/SourceCard";

export function SearchResults({ results }: { results: ResearchResult[] }) {
  if (!results.length) return <p className="muted-copy research-empty">Search results keep the original document name and page number.</p>;
  return <div className="source-list">{results.map((result, index) => <SourceCard key={`${result.documentId}-${result.page}-${index}`} result={result} />)}</div>;
}
