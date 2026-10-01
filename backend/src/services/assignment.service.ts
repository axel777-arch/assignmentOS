import { pool, query } from "@/config/database";
import type { AssignmentRecord, RequirementRecord } from "@/types";
import { HttpError } from "@/utils/errors";
import { sanitizeDraft } from "@/utils/sanitize";

type Row = Record<string, unknown>;
function mapRow(row: Row): AssignmentRecord {
  return {
    id: String(row.id), userId: String(row.user_id), title: String(row.title), course: String(row.course || ""), subject: String(row.subject || ""),
    due: row.due ? String(row.due).slice(0, 10) : null, instructions: String(row.instructions || ""), targetWords: Number(row.target_words || 0),
    minWords: Number(row.min_words || 0), maxWords: Number(row.max_words || 0), sourceTarget: Number(row.source_target || 0),
    requirements: Array.isArray(row.requirements) ? row.requirements as RequirementRecord[] : [], draft: String(row.draft || ""), updatedAt: String(row.updated_at || "")
  };
}
const selectAssignments = `SELECT a.*, COALESCE(json_agg(json_build_object('id', r.id, 'text', r.text, 'kind', r.kind, 'status', r.status, 'evidence', r.evidence)) FILTER (WHERE r.id IS NOT NULL), '[]') AS requirements, COALESCE(d.content, '') AS draft FROM assignments a LEFT JOIN requirements r ON r.assignment_id = a.id LEFT JOIN drafts d ON d.assignment_id = a.id`;

export async function listAssignments(userId: string) {
  const result = await query<Row>(`${selectAssignments} WHERE a.user_id = $1 GROUP BY a.id, d.content ORDER BY a.updated_at DESC`, [userId]);
  return result.rows.map(mapRow);
}
export async function getAssignment(userId: string, id: string) {
  const result = await query<Row>(`${selectAssignments} WHERE a.user_id = $1 AND a.id = $2 GROUP BY a.id, d.content`, [userId, id]);
  if (!result.rows[0]) throw new HttpError(404, "Assignment not found.");
  return mapRow(result.rows[0]);
}
export async function createAssignment(userId: string, input: Partial<AssignmentRecord> & { title: string }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [userId]);
    const result = await client.query<Row>("INSERT INTO assignments (user_id,title,course,subject,due,instructions,target_words,min_words,max_words,source_target) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *", [userId,input.title,input.course || "",input.subject || "",input.due || null,input.instructions || "",input.targetWords || 0,input.minWords || 0,input.maxWords || 0,input.sourceTarget || 0]);
    const assignmentId = String(result.rows[0].id);
    for (const requirement of input.requirements || []) await client.query("INSERT INTO requirements (id,assignment_id,text,kind,status,evidence) VALUES ($1,$2,$3,$4,$5,$6)", [requirement.id,assignmentId,requirement.text,requirement.kind,requirement.status || "not_checked",requirement.evidence || null]);
    await client.query("INSERT INTO drafts (assignment_id,content) VALUES ($1,$2)", [assignmentId,sanitizeDraft(input.draft || "")]);
    await client.query("COMMIT");
    return getAssignment(userId, assignmentId);
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
export async function updateAssignment(userId: string, id: string, updates: Partial<AssignmentRecord>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const owned = await client.query("SELECT id FROM assignments WHERE id = $1 AND user_id = $2", [id,userId]);
    if (!owned.rowCount) throw new HttpError(404, "Assignment not found.");
    const columns: Record<string, string> = { title: "title", course: "course", subject: "subject", due: "due", instructions: "instructions", targetWords: "target_words", minWords: "min_words", maxWords: "max_words", sourceTarget: "source_target" };
    const values: unknown[] = [];
    const setters = Object.entries(columns).filter(([key]) => Object.hasOwn(updates, key)).map(([key, column]) => { values.push((updates as Record<string, unknown>)[key]); return `${column} = $${values.length}`; });
    if (setters.length) { values.push(id, userId); const changed = await client.query(`UPDATE assignments SET ${setters.join(", ")}, updated_at = now() WHERE id = $${values.length - 1} AND user_id = $${values.length} RETURNING id`, values); if (!changed.rowCount) throw new HttpError(404, "Assignment not found."); }
    if (updates.requirements) {
      await client.query("DELETE FROM requirements WHERE assignment_id = $1", [id]);
      for (const requirement of updates.requirements) await client.query("INSERT INTO requirements (id,assignment_id,text,kind,status,evidence) VALUES ($1,$2,$3,$4,$5,$6)", [requirement.id,id,requirement.text,requirement.kind,requirement.status,requirement.evidence || null]);
    }
    if (typeof updates.draft === "string") await client.query("INSERT INTO drafts (assignment_id,content) VALUES ($1,$2) ON CONFLICT (assignment_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now()", [id,sanitizeDraft(updates.draft)]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  return getAssignment(userId,id);
}
export async function deleteAssignment(userId: string, id: string) {
  const result = await query("DELETE FROM assignments WHERE id = $1 AND user_id = $2 RETURNING id", [id,userId]);
  if (!result.rowCount) throw new HttpError(404, "Assignment not found.");
}
