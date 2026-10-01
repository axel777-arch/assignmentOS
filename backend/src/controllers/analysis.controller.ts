import type { RequestHandler } from "express";
import { analyze } from "@/services/analysis.service";
import { success } from "@/utils/apiResponse";

export const run: RequestHandler = async (request, response) => success(response, await analyze(request.user!.id, request.body.assignmentId, request.body.draft));
