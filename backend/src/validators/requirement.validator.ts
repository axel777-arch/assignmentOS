import { z } from "zod";

export const requirementSchema = z.object({ id: z.string().min(1).max(80), text: z.string().trim().min(1).max(1000), kind: z.enum(["concept", "section", "length", "sources", "deadline"]), status: z.enum(["not_checked", "met", "partial", "missing"]).default("not_checked"), evidence: z.string().max(2000).optional() });
export const extractRequirementsSchema = z.object({ brief: z.string().trim().min(1).max(20_000), targetWords: z.number().int().nonnegative().optional() });
export const saveRequirementsSchema = z.object({ requirements: z.array(requirementSchema).max(100) });
