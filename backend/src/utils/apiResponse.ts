import type { Response } from "express";

export function success<T>(response: Response, data: T, status = 200) {
  return response.status(status).json({ data });
}

export function failure(response: Response, status: number, message: string, details?: unknown) {
  return response.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}
