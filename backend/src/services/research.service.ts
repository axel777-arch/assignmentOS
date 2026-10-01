import { env } from "@/config/env";
import { getAssignment } from "@/services/assignment.service";

export async function searchResearch(userId: string, assignmentId: string, query: string) {
  await getAssignment(userId, assignmentId);
  const response = await fetch(`${env.DOCUMENT_SERVICE_URL}/api/search`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentId, query }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Document service returned HTTP ${response.status}.`);
  return response.json() as Promise<{ results: Array<{ documentId: string; documentName: string; page: number; excerpt: string; score: number }> }>;
}
