import type { RequestHandler } from "express";
import { completeInlineText, writeAssignmentDraft } from "@/services/writing.service";
import { success } from "@/utils/apiResponse";

export const complete: RequestHandler = async (request, response) => {
  const result = await completeInlineText(request.user!.id, request.body);
  return success(response, result);
};

export const draft: RequestHandler = async (request, response) => {
  const result = await writeAssignmentDraft(request.user!.id, request.body);
  return success(response, result);
};
