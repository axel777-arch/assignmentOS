import { Router } from "express";
import { reply } from "@/controllers/assistant.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { assistantSchema } from "@/validators/document.validator";

export const assistantRoutes = Router();
assistantRoutes.use(requireAuth);
assistantRoutes.post("/", validateBody(assistantSchema), reply);
