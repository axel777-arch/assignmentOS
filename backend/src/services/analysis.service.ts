import { analyzeAssignment } from "@/services/ai.service";
import { getAssignment } from "@/services/assignment.service";
import { query } from "@/config/database";

export async function analyze(userId: string, assignmentId: string, draft?: string) {
  const assignment = await getAssignment(userId, assignmentId);
  const result = await analyzeAssignment(assignment, draft ?? assignment.draft);
  await query("INSERT INTO analyses (assignment_id,score,result,disclaimer,model_version) VALUES ($1,$2,$3,$4,$5)", [assignmentId,result.score,JSON.stringify(result),result.disclaimer,"heuristic-v1"]);
  return result;
}
