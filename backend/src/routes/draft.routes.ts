import { Router } from "express";
import * as controller from "@/controllers/draft.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { z } from "zod";

export const draftRoutes = Router();
draftRoutes.use(requireAuth);
draftRoutes.put("/:assignmentId", validateBody(z.object({ content: z.string().max(500_000) })), controller.update);
