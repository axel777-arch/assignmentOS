import { Router } from "express";
import * as controller from "@/controllers/requirement.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { extractRequirementsSchema, saveRequirementsSchema } from "@/validators/requirement.validator";

export const requirementRoutes = Router();
requirementRoutes.use(requireAuth);
requirementRoutes.post("/extract", validateBody(extractRequirementsSchema), controller.extract);
requirementRoutes.put("/:assignmentId", validateBody(saveRequirementsSchema), controller.save);
