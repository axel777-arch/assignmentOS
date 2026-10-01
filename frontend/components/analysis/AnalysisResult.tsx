import type { AnalysisResult as Result } from "@/types/analysis";
import { RequirementStatusBadge } from "@/components/requirements/RequirementStatus";
import { SuggestionCard } from "@/components/analysis/SuggestionCard";

export function AnalysisResult({ result }: { result: Result }) {
  return <div className="analysis-result"><div className="score-line"><span className="score-value">{result.score}</span><div><strong>{result.summary}</strong><small>Checklist estimate · not a grade</small></div></div>
    <div className="analysis-items">{result.items.map((item) => <div className="analysis-item" key={item.requirementId}><RequirementStatusBadge status={item.status} /><p>{item.evidence}</p>{item.suggestion && <SuggestionCard>{item.suggestion}</SuggestionCard>}</div>)}</div>
    <p className="analysis-disclaimer">{result.disclaimer}</p>
  </div>;
}
