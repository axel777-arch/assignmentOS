import { query } from "@/config/database";
import { getAssignment } from "@/services/assignment.service";
import { assistantReply } from "@/services/ai.service";
import type { AssignmentRecord } from "@/types";

export type AssistantMessageRecord = {
  id: string;
  assignmentId: string;
  role: "user" | "assistant";
  message: string;
  createdAt: string;
};

type ChatRow = {
  id: string;
  assignment_id: string;
  role: string;
  message: string;
  created_at: Date;
};

export async function getAssistantHistory(userId: string, assignmentId: string): Promise<AssistantMessageRecord[]> {
  const assignment = await getAssignment(userId, assignmentId);
  if (!assignment) return [];

  const result = await query<ChatRow>(
    "SELECT id, assignment_id, role, message, created_at FROM assistant_chats WHERE user_id = $1 AND assignment_id = $2 ORDER BY created_at ASC LIMIT 50",
    [userId, assignmentId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    assignmentId: row.assignment_id,
    role: row.role as "user" | "assistant",
    message: row.message,
    createdAt: row.created_at.toISOString()
  }));
}

export async function processAssistantMessage(userId: string, assignmentId: string | undefined, message: string) {
  let assignment: AssignmentRecord | undefined;
  let history: Array<{ role: string; message: string }> = [];
  let documentExcerpts: Array<{ pageNumber: number; fileName: string; content: string }> = [];
  let latestAnalysisSummary: string | undefined;

  if (assignmentId) {
    assignment = (await getAssignment(userId, assignmentId)) || undefined;
    if (assignment) {
      // 1. Fetch recent history for layered context
      const historyRes = await query<ChatRow>(
        "SELECT role, message FROM assistant_chats WHERE user_id = $1 AND assignment_id = $2 ORDER BY created_at DESC LIMIT 6",
        [userId, assignmentId]
      );
      history = historyRes.rows.reverse().map((r) => ({ role: r.role, message: r.message }));

      // 2. Fetch top relevant document chunks matching user message terms
      const searchTerms = message
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 3)
        .join(" | ");

      if (searchTerms) {
        const chunkRes = await query<{ page_number: number; file_name: string; content: string }>(
          `SELECT dc.page_number, d.file_name, dc.content
           FROM document_chunks dc
           JOIN documents d ON dc.document_id = d.id
           WHERE dc.assignment_id = $1 AND dc.content ~* $2
           LIMIT 2`,
          [assignmentId, searchTerms.replace(/[^a-zA-Z0-9| ]/g, "")]
        );
        documentExcerpts = chunkRes.rows.map((r) => ({ pageNumber: r.page_number, fileName: r.file_name, content: r.content.slice(0, 400) }));
      }

      // 3. Fetch latest analysis summary
      const analysisRes = await query<{ result: { summary?: string } }>(
        "SELECT result FROM analyses WHERE assignment_id = $1 ORDER BY created_at DESC LIMIT 1",
        [assignmentId]
      );
      if (analysisRes.rows[0]?.result?.summary) {
        latestAnalysisSummary = analysisRes.rows[0].result.summary;
      }
    }
  }

  // Save student's user message if tied to assignment
  if (assignmentId && assignment) {
    await query("INSERT INTO assistant_chats (assignment_id, user_id, role, message) VALUES ($1, $2, 'user', $3)", [assignmentId, userId, message]);
  }

  // Context bundle for AI reply
  const contextPayload = {
    assignment: assignment
      ? {
          id: assignment.id,
          title: assignment.title,
          subject: assignment.subject,
          course: assignment.course,
          instructions: assignment.instructions,
          targetWords: assignment.targetWords,
          requirements: assignment.requirements,
          draft: (assignment.draft || "").slice(0, 5000),
          latestAnalysisSummary,
          documentExcerpts
        }
      : undefined,
    history,
    message
  };

  const response = await assistantReply(contextPayload.assignment, message, history, documentExcerpts);

  // Save assistant reply if tied to assignment
  if (assignmentId && assignment) {
    await query("INSERT INTO assistant_chats (assignment_id, user_id, role, message) VALUES ($1, $2, 'assistant', $3)", [assignmentId, userId, response.reply]);
  }

  return response;
}
