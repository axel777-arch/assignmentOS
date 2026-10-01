import type { RequestHandler } from "express";
import { getCurrentUser, loginStudent, logoutStudent, registerStudent, updateStudentProfile } from "@/services/auth.service";
import { success } from "@/utils/apiResponse";

export const me: RequestHandler = async (request, response) => success(response, { user: await getCurrentUser(request) });
export const register: RequestHandler = async (request, response) => success(response, { user: await registerStudent(request.body, response) }, 201);
export const login: RequestHandler = async (request, response) => success(response, { user: await loginStudent(request.body, response) });
export const logout: RequestHandler = async (_request, response) => { logoutStudent(response); return success(response, { ok: true }); };
export const updateProfile: RequestHandler = async (request, response) => success(response, { user: await updateStudentProfile(request.user!.id, request.body) });
