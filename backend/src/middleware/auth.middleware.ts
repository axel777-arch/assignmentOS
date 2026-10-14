import type { RequestHandler } from "express";
import { supabaseAdmin } from "@/config/supabase";
import { env } from "@/config/env";
import { verifySessionToken } from "@/services/auth.service";
import { failure } from "@/utils/apiResponse";

function sessionCookie(request: Parameters<RequestHandler>[0]) {
  const value = request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("assignmentos_session="));
  return value ? decodeURIComponent(value.slice("assignmentos_session=".length)) : undefined;
}

export const requireAuth: RequestHandler = async (request, response, next) => {
  const cookieToken = sessionCookie(request);
  if (cookieToken) {
    try {
      const claims = verifySessionToken(cookieToken);
      if (!claims.sub) return failure(response, 401, "A valid session is required.");
      request.user = { id: claims.sub, username: typeof claims.username === "string" ? claims.username : undefined };
      return next();
    } catch {
      return failure(response, 401, "Your session has expired. Sign in again.");
    }
  }

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (token) {
    try {
      const claims = verifySessionToken(token);
      if (claims.sub) {
        request.user = { id: claims.sub, username: typeof claims.username === "string" ? claims.username : undefined };
        return next();
      }
    } catch {
      // Fall through to check supabase if available
    }

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        request.user = { id: data.user.id, email: data.user.email };
        return next();
      }
    }

    return failure(response, 401, "A valid access token is required.");
  }

  // Development bypass only if explicitly requested via DEV_MODE
  if (process.env.AUTH_BYPASS === "true" && env.NODE_ENV !== "production") {
    request.user = { id: env.DEV_USER_ID, username: "dev_student" };
    return next();
  }

  return failure(response, 401, "Authentication is required.");
};
