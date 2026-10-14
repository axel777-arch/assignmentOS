import type { RequestHandler } from "express";
import { getCurrentUser, getGoogleAuthUrl, handleGoogleOAuthCallback, loginStudent, logoutStudent, registerStudent, updateStudentProfile } from "@/services/auth.service";
import { success } from "@/utils/apiResponse";
import { env } from "@/config/env";

export const me: RequestHandler = async (request, response) => success(response, { user: await getCurrentUser(request) });
export const register: RequestHandler = async (request, response) => success(response, { user: await registerStudent(request.body, response) }, 201);
export const login: RequestHandler = async (request, response) => success(response, { user: await loginStudent(request.body, response) });
export const logout: RequestHandler = async (_request, response) => { logoutStudent(response); return success(response, { ok: true }); };
export const updateProfile: RequestHandler = async (request, response) => success(response, { user: await updateStudentProfile(request.user!.id, request.body) });

export const googleAuth: RequestHandler = (_request, response) => {
  if (!env.GOOGLE_CLIENT_ID) {
    return response.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Sign-In Simulation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 16px; }
          .card { background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 32px; width: 100%; max-width: 400px; text-align: center; }
          .logo { margin-bottom: 20px; }
          h2 { font-size: 20px; color: #1e293b; margin: 0 0 8px; }
          p { color: #64748b; font-size: 13px; margin: 0 0 24px; }
          .account-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; cursor: pointer; text-align: left; margin-bottom: 12px; font-size: 14px; font-weight: 500; transition: background 0.15s; }
          .account-btn:hover { background: #f1f5f9; }
          .avatar { width: 36px; height: 36px; border-radius: 50%; background: #4285F4; color: white; display: grid; place-items: center; font-weight: bold; flex-shrink: 0; }
          .avatar.b { background: #34A853; }
          .meta { display: flex; flex-direction: column; }
          .meta small { color: #64748b; font-size: 12px; font-weight: normal; }
          .custom-form { margin-top: 16px; text-align: left; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; margin-bottom: 10px; font-size: 13px; }
          .submit-btn { width: 100%; padding: 10px; background: #1e293b; color: white; border: 0; border-radius: 6px; font-weight: 600; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <h2>Sign in with Google</h2>
          <p>Choose a student account to continue to AssignmentOS</p>
          <form method="POST" action="/api/auth/google/dev-select">
            <input type="hidden" name="email" value="alex.student@gmail.com">
            <input type="hidden" name="name" value="Alex Student">
            <button type="submit" class="account-btn">
              <div class="avatar">A</div>
              <div class="meta">
                <span>Alex Student</span>
                <small>alex.student@gmail.com</small>
              </div>
            </button>
          </form>
          <form method="POST" action="/api/auth/google/dev-select">
            <input type="hidden" name="email" value="taylor.collab@gmail.com">
            <input type="hidden" name="name" value="Taylor Collaborator">
            <button type="submit" class="account-btn">
              <div class="avatar b">T</div>
              <div class="meta">
                <span>Taylor Collaborator</span>
                <small>taylor.collab@gmail.com</small>
              </div>
            </button>
          </form>
          <form method="POST" action="/api/auth/google/dev-select" class="custom-form">
            <input type="text" name="name" placeholder="Full name (e.g. Jordan Lee)" required>
            <input type="email" name="email" placeholder="Google email address" required>
            <button type="submit" class="submit-btn">Continue with Custom Google Account</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }
  try {
    const url = getGoogleAuthUrl();
    return response.redirect(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Google OAuth unavailable";
    return response.redirect(`${env.FRONTEND_ORIGIN}/login?error=${encodeURIComponent(msg)}`);
  }
};

export const googleDevSelect: RequestHandler = async (request, response) => {
  const email = (request.body.email || "student@gmail.com").trim().toLowerCase();
  const name = (request.body.name || email.split("@")[0]).trim();
  const googleId = "google_dev_" + Buffer.from(email).toString("hex").slice(0, 16);
  const { processGoogleProfile } = await import("@/services/auth.service");
  await processGoogleProfile({ id: googleId, email, name }, response);
  return response.redirect(`${env.FRONTEND_ORIGIN}/dashboard`);
};

export const googleCallback: RequestHandler = async (request, response) => {
  const code = request.query.code as string | undefined;
  if (!code) {
    return response.redirect(`${env.FRONTEND_ORIGIN}/login?error=No+authorization+code+provided`);
  }
  try {
    await handleGoogleOAuthCallback(code, response);
    return response.redirect(`${env.FRONTEND_ORIGIN}/dashboard`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Authentication failed";
    return response.redirect(`${env.FRONTEND_ORIGIN}/login?error=${encodeURIComponent(msg)}`);
  }
};

