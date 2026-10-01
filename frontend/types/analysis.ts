import type { RequirementStatus } from "@/types/requirement";

export type AnalysisResult = {
  score: number;
  summary: string;
  items: Array<{ requirementId: string; status: RequirementStatus; evidence: string; suggestion: string }>;
  disclaimer: string;
};
