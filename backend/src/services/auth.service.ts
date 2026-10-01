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
type UserRow = { id: string; username: string | null; display_name: string; email: string | null; avatar_data?: string | null; password_hash?: string | null };
type ProfileUpdate = { username: string; displayName: string; avatarData: string | null };

function setSession(response: Response, user: UserRow) {
  const token = jwt.sign({ username: user.username }, env.JWT_SECRET, { subject: user.id, issuer: "assignmentos", expiresIn: SESSION_SECONDS });
  response.cookie(COOKIE_NAME, token, { httpOnly: true, secure: env.COOKIE_SECURE === "true", sameSite: "lax", maxAge: SESSION_SECONDS * 1000, path: "/" });
}

function publicUser(user: UserRow) {
  return { id: user.id, username: user.username || "student", displayName: user.display_name, email: user.email || "", avatarData: user.avatar_data || null };
}

export async function registerStudent(input: Registration, response: Response) {
  if (Buffer.byteLength(input.password, "utf8") > 72) throw new HttpError(400, "Password must be 72 bytes or fewer.");
  const username = input.username.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  try {
    const result = await query<UserRow>("INSERT INTO users (id, username, password_hash, display_name, email) VALUES ($1,$2,$3,$4,$5) RETURNING id, username, display_name, email, avatar_data", [randomUUID(), username, passwordHash, input.displayName.trim() || username, input.email?.trim().toLowerCase() || null]);
    const user = result.rows[0];
    setSession(response, user);
    return publicUser(user);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw new HttpError(409, "That username or email is already registered.");
    throw error;
  }
}

export async function loginStudent(input: Credentials, response: Response) {
  const result = await query<UserRow>("SELECT id, username, display_name, email, password_hash FROM users WHERE lower(username) = lower($1) LIMIT 1", [input.username.trim()]);
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
  const result = await query<UserRow>("SELECT id, username, display_name, email, avatar_data FROM users WHERE id = $1 LIMIT 1", [request.user.id]);
  return result.rows[0] ? publicUser(result.rows[0]) : { id: request.user.id, username: request.user.username || "student", displayName: "Student", email: request.user.email || "" };
}

export async function updateStudentProfile(userId: string, input: ProfileUpdate) {
  try {
    const result = await query<UserRow>("UPDATE users SET username = $2, display_name = $3, avatar_data = $4, updated_at = now() WHERE id = $1 RETURNING id, username, display_name, email, avatar_data", [userId, input.username.trim().toLowerCase(), input.displayName.trim(), input.avatarData]);
    if (!result.rowCount) throw new HttpError(404, "Student account not found.");
    return publicUser(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw new HttpError(409, "That username is already in use.");
    throw error;
  }
}

export function verifySessionToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: "assignmentos" }) as jwt.JwtPayload;
}
