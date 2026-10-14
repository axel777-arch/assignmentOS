import { Router } from "express";
import {
  applyDraft,
  compare,
  createShare,
  differentiate,
  getDetails,
  listCollaborations,
  postChat,
  saveDraftHandler
} from "@/controllers/collaboration.controller";
import { requireAuth } from "@/middleware/auth.middleware";

export const collaborationRoutes = Router();
collaborationRoutes.use(requireAuth);
collaborationRoutes.get("/", listCollaborations);
collaborationRoutes.post("/share", createShare);
collaborationRoutes.get("/:id", getDetails);
collaborationRoutes.post("/:id/chat", postChat);
collaborationRoutes.post("/:id/draft", saveDraftHandler);
collaborationRoutes.post("/:id/compare", compare);
collaborationRoutes.post("/:id/differentiate", differentiate);
collaborationRoutes.post("/:id/apply", applyDraft);

