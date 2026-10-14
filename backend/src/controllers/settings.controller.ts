import type { RequestHandler } from "express";
import { getUserSettings, updateUserSettings } from "@/services/settings.service";
import { success } from "@/utils/apiResponse";

export const getSettings: RequestHandler = async (request, response) => {
  const settings = await getUserSettings(request.user!.id);
  return success(response, { settings });
};

export const patchSettings: RequestHandler = async (request, response) => {
  const settings = await updateUserSettings(request.user!.id, request.body);
  return success(response, { settings });
};
