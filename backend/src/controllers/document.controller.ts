import type { RequestHandler } from "express";
import { ingestDocument } from "@/services/document.service";
import { HttpError } from "@/utils/errors";
import { success } from "@/utils/apiResponse";

export const upload: RequestHandler = async (request, response) => {
  if (!request.file) throw new HttpError(400, "A PDF file is required.");
  const assignmentId = String(request.body.assignmentId || "");
  if (!assignmentId) throw new HttpError(400, "An assignment ID is required.");
  return success(response, await ingestDocument(request.user!.id, assignmentId, request.file), 201);
};
