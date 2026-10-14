import { analyzeAssignment, type AnalysisOutput } from "@/services/ai.service";
import { getAssignment } from "@/services/assignment.service";
import { query } from "@/config/database";

export async function analyze(userId: string, assignmentId: string, draft?: string): Promise<AnalysisOutput> {
  const assignment = await getAssignment(userId, assignmentId);
  const draftToAnalyze = draft ?? assignment.draft;
  const result = await analyzeAssignment(assignment, draftToAnalyze);

  await query(
    "INSERT INTO analyses (assignment_id, score, result, disclaimer, model_version) VALUES ($1, $2, $3, $4, $5)",
    [assignmentId, result.score, JSON.stringify(result), result.disclaimer, "v1"]
  );

  // Update status and evidence in requirements table
  for (const item of result.items) {
    await query(
      "UPDATE requirements SET status = $1, evidence = $2 WHERE id = $3 AND assignment_id = $4",
      [item.status, item.evidence, item.requirementId, assignmentId]
    );
  }

  return result;
}

export async function getLatestAnalysis(userId: string, assignmentId: string): Promise<AnalysisOutput | null> {
  await getAssignment(userId, assignmentId);
  const row = await query<{ score: number; result: AnalysisOutput; disclaimer: string; created_at: Date }>(
    "SELECT score, result, disclaimer, created_at FROM analyses WHERE assignment_id = $1 ORDER BY created_at DESC LIMIT 1",
    [assignmentId]
  );
  if (!row.rows[0]) return null;
  const item = row.rows[0];
  const parsed = item.result;
  return {
    ...parsed,
    score: item.score,
    disclaimer: item.disclaimer,
    checkedAt: item.created_at.toISOString()
  };
}
