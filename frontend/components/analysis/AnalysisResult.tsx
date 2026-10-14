import type { AnalysisResult as Result } from "@/types/analysis";
import { RequirementStatusBadge } from "@/components/requirements/RequirementStatus";
import { SuggestionCard } from "@/components/analysis/SuggestionCard";
import { AlertTriangle, Clock, Lightbulb, Sparkles } from "lucide-react";

export function AnalysisResult({ result }: { result: Result }) {
  const formattedTime = result.checkedAt
    ? new Date(result.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Recently";

  return (
    <div className="analysis-result">
      <div className="score-line">
        <span className="score-value">{result.score}%</span>
        <div>
          <strong>{result.summary}</strong>
          <small className="last-checked-tag">
            <Clock size={11} /> Checked at {formattedTime} · not a grade
          </small>
        </div>
      </div>

      {result.missingRequirements && result.missingRequirements.length > 0 && (
        <div className="analysis-alert-box warning">
          <div className="alert-head">
            <AlertTriangle size={13} />
            <strong>Missing or Unmet Criteria:</strong>
          </div>
          <ul>
            {result.missingRequirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {result.weakSections && result.weakSections.length > 0 && (
        <div className="analysis-alert-box info">
          <div className="alert-head">
            <Lightbulb size={13} />
            <strong>Underdeveloped Areas:</strong>
          </div>
          <ul>
            {result.weakSections.map((sec, i) => (
              <li key={i}>{sec}</li>
            ))}
          </ul>
        </div>
      )}

      {result.improvements && result.improvements.length > 0 && (
        <div className="analysis-alert-box action">
          <div className="alert-head">
            <Sparkles size={13} />
            <strong>Recommended Improvements:</strong>
          </div>
          <ul>
            {result.improvements.map((imp, i) => (
              <li key={i}>{imp}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="analysis-items">
        {result.items.map((item) => (
          <div className="analysis-item" key={item.requirementId}>
            <RequirementStatusBadge status={item.status} />
            <p>{item.evidence}</p>
            {item.suggestion && <SuggestionCard>{item.suggestion}</SuggestionCard>}
          </div>
        ))}
      </div>

      <p className="analysis-disclaimer">{result.disclaimer}</p>
    </div>
  );
}
