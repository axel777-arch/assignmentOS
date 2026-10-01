import { query } from "@/config/database";
import { getAssignment } from "@/services/assignment.service";
import { sanitizeDraft } from "@/utils/sanitize";

export async function saveDraft(userId: string, assignmentId: string, content: string) {
  await getAssignment(userId, assignmentId);
  await query("INSERT INTO drafts (assignment_id,content) VALUES ($1,$2) ON CONFLICT (assignment_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now()", [assignmentId,sanitizeDraft(content)]);
  return getAssignment(userId, assignmentId);
}
