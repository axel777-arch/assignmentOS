import type { RequestHandler } from "express";
import { analyze, getLatestAnalysis } from "@/services/analysis.service";
import { success } from "@/utils/apiResponse";

export const run: RequestHandler = async (request, response) => {
  const result = await analyze(request.user!.id, request.body.assignmentId, request.body.draft);
  return success(response, result);
};

export const getLatest: RequestHandler = async (request, response) => {
  const assignmentId = Array.isArray(request.params.assignmentId) ? request.params.assignmentId[0] : request.params.assignmentId;
  const result = await getLatestAnalysis(request.user!.id, assignmentId);
  return success(response, { analysis: result });
};
