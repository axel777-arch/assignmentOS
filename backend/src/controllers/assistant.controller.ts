import type { RequestHandler } from "express";
import { getAssistantHistory, processAssistantMessage } from "@/services/assistant.service";
import { success } from "@/utils/apiResponse";

export const reply: RequestHandler = async (request, response) => {
  const result = await processAssistantMessage(request.user!.id, request.body.assignmentId, request.body.message);
  return success(response, result);
};

export const history: RequestHandler = async (request, response) => {
  const assignmentId = request.query.assignmentId as string;
  if (!assignmentId) return success(response, { history: [] });
  const records = await getAssistantHistory(request.user!.id, assignmentId);
  return success(response, { history: records });
};
