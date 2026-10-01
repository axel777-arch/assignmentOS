import type { RequestHandler } from "express";
import { searchResearch } from "@/services/research.service";
import { success } from "@/utils/apiResponse";

export const search: RequestHandler = async (request, response) => success(response, await searchResearch(request.user!.id, request.body.assignmentId, request.body.query));
