import { z } from "zod";
import { requirementSchema } from "@/validators/requirement.validator";

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(1).max(200), course: z.string().max(120).default(""), subject: z.string().max(120).default(""), due: z.string().date().nullable().optional(),
  instructions: z.string().max(20_000).default(""), targetWords: z.number().int().nonnegative().default(0), minWords: z.number().int().nonnegative().default(0), maxWords: z.number().int().nonnegative().default(0),
  sourceTarget: z.number().int().nonnegative().default(0), requirements: z.array(requirementSchema).max(100).default([]), draft: z.string().max(500_000).default("")
});
export const updateAssignmentSchema = createAssignmentSchema.partial().refine((value) => Object.keys(value).length > 0, "At least one field is required.");
