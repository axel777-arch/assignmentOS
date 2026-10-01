import { pool } from "@/config/database";
import { extractRequirements } from "@/services/ai.service";
import { getAssignment } from "@/services/assignment.service";
import type { RequirementRecord } from "@/types";

export function extractFromBrief(brief: string, targetWords = 0) { return extractRequirements(brief, targetWords); }

export async function saveRequirements(userId: string, assignmentId: string, requirements: RequirementRecord[]) {
  await getAssignment(userId, assignmentId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM requirements WHERE assignment_id = $1", [assignmentId]);
    for (const [position, requirement] of requirements.entries()) await client.query("INSERT INTO requirements (id,assignment_id,text,kind,status,evidence,position) VALUES ($1,$2,$3,$4,$5,$6,$7)", [requirement.id,assignmentId,requirement.text,requirement.kind,requirement.status,requirement.evidence || null,position]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  return getAssignment(userId,assignmentId);
}
