import { Router } from "express";
import * as controller from "@/controllers/research.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { documentSearchSchema } from "@/validators/document.validator";

export const researchRoutes = Router();
researchRoutes.use(requireAuth);
researchRoutes.post("/", validateBody(documentSearchSchema), controller.search);
