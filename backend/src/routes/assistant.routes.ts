import { Router } from "express";
import { history, reply } from "@/controllers/assistant.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { assistantSchema } from "@/validators/document.validator";

export const assistantRoutes = Router();
assistantRoutes.use(requireAuth);
assistantRoutes.get("/history", history);
assistantRoutes.post("/", validateBody(assistantSchema), reply);
