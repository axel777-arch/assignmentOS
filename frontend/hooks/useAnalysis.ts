"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { Assignment } from "@/types/assignment";
import type { AnalysisResult } from "@/types/analysis";

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const analyze = useCallback(async (assignment: Assignment, draft: string) => {
    setLoading(true);
    try { const next = await api.analysis.run(assignment, draft); setResult(next); return next; }
    finally { setLoading(false); }
  }, []);
  return { result, loading, analyze };
}
