import { Router } from "express";
import * as controller from "@/controllers/analysis.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { analysisSchema } from "@/validators/document.validator";

export const analysisRoutes = Router();
analysisRoutes.use(requireAuth);
analysisRoutes.get("/:assignmentId", controller.getLatest);
analysisRoutes.post("/", validateBody(analysisSchema), controller.run);
