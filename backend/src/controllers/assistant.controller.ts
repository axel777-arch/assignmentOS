import type { RequestHandler } from "express";
import { assistantReply } from "@/services/ai.service";
import { getAssignment } from "@/services/assignment.service";
import { success } from "@/utils/apiResponse";

export const reply: RequestHandler = async (request, response) => {
  const assignment = request.body.assignmentId ? await getAssignment(request.user!.id, request.body.assignmentId) : undefined;
  return success(response, await assistantReply(assignment, request.body.message));
};
