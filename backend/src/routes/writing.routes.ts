import { Router } from "express";
import { complete, draft } from "@/controllers/writing.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { z } from "zod";

const completeSchema = z.object({
  assignmentId: z.string().uuid(),
  prefixText: z.string().max(10_000),
  paragraphText: z.string().max(10_000).optional()
});

const draftSchema = z.object({
  assignmentId: z.string().uuid(),
  action: z.enum([
    "generate_initial_draft",
    "generate_outline",
    "expand_section",
    "rewrite_clarity",
    "improve_grammar",
    "simplify",
    "develop_paragraph",
    "shorten",
    "elaborate",
    "improve_transitions",
    "suggest_examples"
  ]),
  selectedText: z.string().max(50_000).optional(),
  currentDraft: z.string().max(500_000).optional(),
  customInstruction: z.string().max(2_000).optional()
});

export const writingRoutes = Router();
writingRoutes.use(requireAuth);
writingRoutes.post("/complete", validateBody(completeSchema), complete);
writingRoutes.post("/draft", validateBody(draftSchema), draft);
