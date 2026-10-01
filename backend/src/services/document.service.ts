import { randomUUID } from "node:crypto";
import { env } from "@/config/env";
import { query } from "@/config/database";
import { getAssignment } from "@/services/assignment.service";
import type { Express } from "express";

export async function ingestDocument(userId: string, assignmentId: string, file: Express.Multer.File) {
  await getAssignment(userId, assignmentId);
  const form = new FormData();
  form.set("assignmentId", assignmentId);
  form.set("file", new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype }), file.originalname);
  const response = await fetch(`${env.DOCUMENT_SERVICE_URL}/api/documents/extract`, { method: "POST", body: form, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Document service returned HTTP ${response.status}.`);
  const payload = await response.json() as { documentId?: string; pageCount: number; pages: Array<{ page: number; text: string }>; chunks?: Array<{ page: number; chunk: number; text: string }> };
  const id = payload.documentId || randomUUID();
  await query("INSERT INTO documents (id,assignment_id,owner_id,file_name,mime_type,page_count,status) VALUES ($1,$2,$3,$4,$5,$6,'ready')", [id,assignmentId,userId,file.originalname,file.mimetype,payload.pageCount]);
  const chunks = payload.chunks?.length ? payload.chunks : payload.pages.map((page) => ({ page: page.page, chunk: 0, text: page.text }));
  for (const chunk of chunks) await query("INSERT INTO document_chunks (document_id,assignment_id,page_number,chunk_index,content) VALUES ($1,$2,$3,$4,$5)", [id,assignmentId,chunk.page,chunk.chunk,chunk.text]);
  return { document: { id, name: file.originalname, pages: payload.pageCount, status: "ready" as const } };
}
