import { Router } from "express";
import * as controller from "@/controllers/assignment.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { createAssignmentSchema, updateAssignmentSchema } from "@/validators/assignment.validator";

export const assignmentRoutes = Router();
assignmentRoutes.use(requireAuth);
assignmentRoutes.get("/", controller.list);
assignmentRoutes.post("/", validateBody(createAssignmentSchema), controller.create);
assignmentRoutes.get("/:id", controller.get);
assignmentRoutes.patch("/:id", validateBody(updateAssignmentSchema), controller.update);
assignmentRoutes.delete("/:id", controller.remove);
