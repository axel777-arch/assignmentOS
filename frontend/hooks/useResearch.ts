"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { ResearchResult } from "@/types/document";

export function useResearch(assignmentId: string) {
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  async function search(query: string) {
    setLoading(true);
    try { const next = await api.documents.search(assignmentId, query); setResults(next); return next; }
    finally { setLoading(false); }
  }
  return { results, loading, search };
}
