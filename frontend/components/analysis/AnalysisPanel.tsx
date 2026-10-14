"use client";

import { CheckCheck, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { AnalysisResult } from "@/components/analysis/AnalysisResult";
import type { AnalysisResult as Result } from "@/types/analysis";

export function AnalysisPanel({
  result,
  loading,
  onAnalyze,
  lastChecked
}: {
  result: Result | null;
  loading: boolean;
  onAnalyze: () => void;
  lastChecked?: string | null;
}) {
  const displayTime = lastChecked
    ? new Date(lastChecked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : result?.checkedAt
    ? new Date(result.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <section className="panel analysis-panel">
      <header className="panel-heading">
        <h2>Readiness Check</h2>
        <span className="panel-kicker">
          {displayTime ? `CHECKED ${displayTime}` : "AUTO-CHECKS EVERY 10M"}
        </span>
      </header>

      <div className="analysis-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <Clock size={12} />
            {displayTime ? `Last checked at ${displayTime}` : "Automatic checks run every ~10 min"}
          </span>
          <Button
            variant="primary"
            onClick={onAnalyze}
            disabled={loading}
            style={{ minHeight: "28px", padding: "4px 10px", fontSize: "11px" }}
          >
            {loading ? <Spinner label="Checking…" /> : <><RefreshCw size={12} /> Check Now</>}
          </Button>
        </div>

        {result ? (
          <AnalysisResult result={result} />
        ) : (
          <div style={{ textAlign: "center", padding: "20px 10px", color: "var(--muted)" }}>
            <p className="muted-copy" style={{ marginBottom: "12px" }}>
              The readiness check compares your current draft against assignment requirements and identifies missing sections or arguments.
            </p>
            <Button variant="primary" onClick={onAnalyze} disabled={loading}>
              {loading ? <Spinner label="Checking…" /> : <><CheckCheck size={14} /> Run Initial Check</>}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
