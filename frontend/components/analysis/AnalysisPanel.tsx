"use client";

import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { AnalysisResult } from "@/components/analysis/AnalysisResult";
import type { AnalysisResult as Result } from "@/types/analysis";

export function AnalysisPanel({ result, loading, onAnalyze }: { result: Result | null; loading: boolean; onAnalyze: () => void }) {
  return <section className="panel analysis-panel"><header className="panel-heading"><h2>Readiness check</h2><span className="panel-kicker">NOT A GRADE</span></header><div className="analysis-content">{result ? <AnalysisResult result={result} /> : <p className="muted-copy">Compare the current draft with the brief and identify likely gaps.</p>}<Button variant="primary" onClick={onAnalyze} disabled={loading}>{loading ? <Spinner label="Analyzing draft" /> : <><CheckCheck size={15} /> Check my draft</>}</Button></div></section>;
}
