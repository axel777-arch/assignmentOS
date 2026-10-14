import { Router } from "express";
import { getSettings, patchSettings } from "@/controllers/settings.controller";
import { requireAuth } from "@/middleware/auth.middleware";

export const settingsRoutes = Router();
settingsRoutes.get("/", requireAuth, getSettings);
settingsRoutes.patch("/", requireAuth, patchSettings);
