import { z } from "zod";

const username = z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, underscores, or hyphens.");
const password = z.string().min(10).max(72);

export const registerSchema = z.object({
  username,
  password,
  displayName: z.string().trim().min(1).max(80).default("Student"),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional()
});

export const loginSchema = z.object({ username, password });

export const updateProfileSchema = z.object({
  username,
  displayName: z.string().trim().min(1).max(80),
  avatarData: z.string().max(700_000).regex(/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+=*$/i).nullable()
});
