import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { failure } from "@/utils/apiResponse";
import { logger } from "@/utils/logger";
import { HttpError } from "@/utils/errors";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) return failure(response, 400, "Request validation failed.", error.flatten());
  if (error instanceof HttpError) return failure(response, error.status, error.message);
  logger.error("Unhandled API error", error);
  return failure(response, 500, "An unexpected server error occurred.");
};
