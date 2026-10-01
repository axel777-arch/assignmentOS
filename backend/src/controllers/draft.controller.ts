import type { RequestHandler } from "express";
import { saveDraft } from "@/services/draft.service";
import { success } from "@/utils/apiResponse";

export const update: RequestHandler = async (request, response) => success(response, { assignment: await saveDraft(request.user!.id, Array.isArray(request.params.assignmentId) ? request.params.assignmentId[0] : request.params.assignmentId, request.body.content) });
