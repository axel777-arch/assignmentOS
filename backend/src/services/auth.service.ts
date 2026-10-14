import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "@/config/env";
import { query } from "@/config/database";
import { HttpError } from "@/utils/errors";
import { hashPassword, verifyPassword } from "@/services/password.service";

const COOKIE_NAME = "assignmentos_session";
const SESSION_SECONDS = 60 * 60 * 12;
type Credentials = { username: string; password: string };
type Registration = Credentials & { displayName: string; email?: string };
type UserRow = {
  id: string;
  username: string | null;
  display_name: string;
  email: string | null;
  avatar_data?: string | null;
  password_hash?: string | null;
  google_id?: string | null;
  auth_provider?: string | null;
};
type ProfileUpdate = { username: string; displayName: string; avatarData: string | null };

function setSession(response: Response, user: UserRow) {
  const token = jwt.sign({ username: user.username }, env.JWT_SECRET, { subject: user.id, issuer: "assignmentos", expiresIn: SESSION_SECONDS });
  response.cookie(COOKIE_NAME, token, { httpOnly: true, secure: env.COOKIE_SECURE === "true", sameSite: "lax", maxAge: SESSION_SECONDS * 1000, path: "/" });
}

function publicUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username || "student",
    displayName: user.display_name,
    email: user.email || "",
    avatarData: user.avatar_data || null,
    googleConnected: Boolean(user.google_id),
    authProvider: user.auth_provider || "local"
  };
}

export async function registerStudent(input: Registration, response: Response) {
  if (Buffer.byteLength(input.password, "utf8") > 72) throw new HttpError(400, "Password must be 72 bytes or fewer.");
  const username = input.username.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  try {
    const result = await query<UserRow>(
      "INSERT INTO users (id, username, password_hash, display_name, email, auth_provider) VALUES ($1,$2,$3,$4,$5,'local') RETURNING id, username, display_name, email, avatar_data, google_id, auth_provider",
      [randomUUID(), username, passwordHash, input.displayName.trim() || username, input.email?.trim().toLowerCase() || null]
    );
    const user = result.rows[0];
    setSession(response, user);
    return publicUser(user);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw new HttpError(409, "That username or email is already registered.");
    throw error;
  }
}

export async function loginStudent(input: Credentials, response: Response) {
  const result = await query<UserRow>(
    "SELECT id, username, display_name, email, password_hash, google_id, auth_provider FROM users WHERE lower(username) = lower($1) LIMIT 1",
    [input.username.trim()]
  );
  const user = result.rows[0];
  const valid = user?.password_hash ? await verifyPassword(input.password, user.password_hash) : false;
  if (!user || !valid) throw new HttpError(401, "Invalid username or password.");
  await query("UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1", [user.id]);
  setSession(response, user);
  return publicUser(user);
}

export function logoutStudent(response: Response) {
  response.clearCookie(COOKIE_NAME, { httpOnly: true, secure: env.COOKIE_SECURE === "true", sameSite: "lax", path: "/" });
}

export async function getCurrentUser(request: Request) {
  if (!request.user) return null;
  const result = await query<UserRow>("SELECT id, username, display_name, email, avatar_data, google_id, auth_provider FROM users WHERE id = $1 LIMIT 1", [request.user.id]);
  return result.rows[0]
    ? publicUser(result.rows[0])
    : { id: request.user.id, username: request.user.username || "student", displayName: "Student", email: request.user.email || "", googleConnected: false, authProvider: "local" };
}

export async function updateStudentProfile(userId: string, input: ProfileUpdate) {
  try {
    const result = await query<UserRow>(
      "UPDATE users SET username = $2, display_name = $3, avatar_data = $4, updated_at = now() WHERE id = $1 RETURNING id, username, display_name, email, avatar_data, google_id, auth_provider",
      [userId, input.username.trim().toLowerCase(), input.displayName.trim(), input.avatarData]
    );
    if (!result.rowCount) throw new HttpError(404, "Student account not found.");
    return publicUser(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw new HttpError(409, "That username is already in use.");
    throw error;
  }
}

export function getGoogleAuthUrl() {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new HttpError(400, "Google OAuth is not configured on this server.");
  }
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = new URLSearchParams({
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    client_id: env.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ].join(" ")
  });
  return `${rootUrl}?${options.toString()}`;
}

export async function processGoogleProfile(
  googleProfile: { id: string; email: string; name: string; picture?: string },
  response: Response
) {
  const googleId = googleProfile.id;
  const email = googleProfile.email.trim().toLowerCase();
  const displayName = googleProfile.name || email.split("@")[0];
  const avatarData = googleProfile.picture || null;

  let result = await query<UserRow>(
    "SELECT id, username, display_name, email, avatar_data, google_id, auth_provider FROM users WHERE google_id = $1 LIMIT 1",
    [googleId]
  );
  let user = result.rows[0];

  if (!user && email) {
    result = await query<UserRow>(
      "SELECT id, username, display_name, email, avatar_data, google_id, auth_provider FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [email]
    );
    user = result.rows[0];

    if (user) {
      await query(
        "UPDATE users SET google_id = $1, auth_provider = 'google', avatar_data = COALESCE(avatar_data, $2), last_login_at = now(), updated_at = now() WHERE id = $3",
        [googleId, avatarData, user.id]
      );
      user.google_id = googleId;
      user.auth_provider = "google";
    }
  }

  if (!user) {
    const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "student";
    let username = baseUsername;
    let count = 1;
    while (true) {
      const existingUser = await query("SELECT 1 FROM users WHERE lower(username) = lower($1)", [username]);
      if (!existingUser.rowCount) break;
      username = `${baseUsername}${count++}`;
    }

    const newId = randomUUID();
    const insertRes = await query<UserRow>(
      "INSERT INTO users (id, username, display_name, email, google_id, auth_provider, avatar_data, last_login_at) VALUES ($1, $2, $3, $4, $5, 'google', $6, now()) RETURNING id, username, display_name, email, avatar_data, google_id, auth_provider",
      [newId, username, displayName, email, googleId, avatarData]
    );
    user = insertRes.rows[0];
  } else {
    await query("UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1", [user.id]);
  }

  setSession(response, user);
  return publicUser(user);
}

export async function handleGoogleOAuthCallback(code: string, response: Response) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new HttpError(400, "Google OAuth is not configured on this server.");
  }
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code"
    }).toString()
  });

  if (!tokenRes.ok) {
    throw new HttpError(401, "Failed to exchange authorization code with Google.");
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new HttpError(401, "Google OAuth did not return an access token.");
  }

  const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });

  if (!userinfoRes.ok) {
    throw new HttpError(401, "Failed to retrieve user info from Google.");
  }

  const googleProfile = (await userinfoRes.json()) as {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };

  return processGoogleProfile(googleProfile, response);
}


export function verifySessionToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: "assignmentos" }) as jwt.JwtPayload;
}
