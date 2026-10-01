import { Router } from "express";
import * as controller from "@/controllers/document.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { upload } from "@/middleware/upload.middleware";

export const documentRoutes = Router();
documentRoutes.use(requireAuth);
documentRoutes.post("/", upload.single("file"), controller.upload);
