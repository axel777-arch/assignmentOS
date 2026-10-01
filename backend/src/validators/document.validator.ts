import { z } from "zod";

export const documentSearchSchema = z.object({ assignmentId: z.string().uuid(), query: z.string().trim().min(1).max(300) });
export const uploadMetadataSchema = z.object({ assignmentId: z.string().uuid() });
export const analysisSchema = z.object({ assignmentId: z.string().uuid(), draft: z.string().max(500_000).optional() });
export const assistantSchema = z.object({ assignmentId: z.string().uuid().optional(), message: z.string().trim().min(1).max(2000) });
