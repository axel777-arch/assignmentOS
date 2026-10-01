import type { RequestHandler } from "express";
import { createAssignment, deleteAssignment, getAssignment, listAssignments, updateAssignment } from "@/services/assignment.service";
import { success } from "@/utils/apiResponse";

const routeId = (value: string | string[]) => Array.isArray(value) ? value[0] : value;
export const list: RequestHandler = async (request, response) => success(response, { assignments: await listAssignments(request.user!.id) });
export const get: RequestHandler = async (request, response) => success(response, { assignment: await getAssignment(request.user!.id, routeId(request.params.id)) });
export const create: RequestHandler = async (request, response) => success(response, { assignment: await createAssignment(request.user!.id, request.body) }, 201);
export const update: RequestHandler = async (request, response) => success(response, { assignment: await updateAssignment(request.user!.id, routeId(request.params.id), request.body) });
export const remove: RequestHandler = async (request, response) => { await deleteAssignment(request.user!.id, routeId(request.params.id)); return success(response, { ok: true }); };
