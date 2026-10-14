import type { RequestHandler } from "express";
import {
  applyDraftToStudentAssignment,
  compareDraftsAI,
  generateDifferentiatedDraftAI,
  getCollaborationDetails,
  getUserCollaborations,
  saveCollaborationDraft,
  sendCollaborationMessage,
  shareAssignment
} from "@/services/collaboration.service";
import { success } from "@/utils/apiResponse";

export const listCollaborations: RequestHandler = async (request, response) => {
  const collaborations = await getUserCollaborations(request.user!.id);
  return success(response, { collaborations });
};

export const createShare: RequestHandler = async (request, response) => {
  const { assignmentId, recipient } = request.body;
  const collaboration = await shareAssignment(request.user!.id, assignmentId, recipient);
  return success(response, { collaboration }, 201);
};

export const getDetails: RequestHandler = async (request, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const details = await getCollaborationDetails(request.user!.id, id);
  return success(response, details);
};

export const postChat: RequestHandler = async (request, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const { message } = request.body;
  const chat = await sendCollaborationMessage(request.user!.id, id, message);
  return success(response, { chat }, 201);
};

export const compare: RequestHandler = async (request, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const result = await compareDraftsAI(request.user!.id, id);
  return success(response, { result });
};

export const differentiate: RequestHandler = async (request, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const result = await generateDifferentiatedDraftAI(request.user!.id, id);
  return success(response, { result });
};

export const applyDraft: RequestHandler = async (request, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const { draftId } = request.body;
  const result = await applyDraftToStudentAssignment(request.user!.id, id, draftId);
  return success(response, result);
};

export const saveDraftHandler: RequestHandler = async (request, response) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const { content, draftType } = request.body;
  const result = await saveCollaborationDraft(request.user!.id, id, content, draftType);
  return success(response, { draft: result }, 201);
};

