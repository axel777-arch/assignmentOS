import type { RequestHandler } from "express";
import { extractFromBrief, saveRequirements } from "@/services/requirement.service";
import { success } from "@/utils/apiResponse";

export const extract: RequestHandler = async (request, response) => success(response, { requirements: await extractFromBrief(request.body.brief, request.body.targetWords) });
export const save: RequestHandler = async (request, response) => success(response, { assignment: await saveRequirements(request.user!.id, Array.isArray(request.params.assignmentId) ? request.params.assignmentId[0] : request.params.assignmentId, request.body.requirements) });
