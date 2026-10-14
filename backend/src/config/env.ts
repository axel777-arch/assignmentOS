import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("postgres://assignmentos:assignmentos@127.0.0.1:5432/assignmentos"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:3000"),
  AI_SERVICE_URL: z.string().default("http://127.0.0.1:8000"),
  DOCUMENT_SERVICE_URL: z.string().default("http://127.0.0.1:8001"),
  AI_PROVIDER: z.enum(["ollama", "openai", "local"]).default("ollama"),
  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().default("llama3.2:3b"),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  AI_MODEL: z.string().default("gpt-4o-mini"),
  JWT_SECRET: z.string().default("local-development-secret-change-me-32-chars"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  SUPABASE_URL: z.string().url().or(z.literal("")).default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DEV_USER_ID: z.string().uuid().default("00000000-0000-4000-8000-000000000001"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALLBACK_URL: z.string().optional().default("http://localhost:4000/api/auth/google/callback")
});

export const env = schema.parse(process.env);
const jwtSecret = process.env.JWT_SECRET || "";
if (env.NODE_ENV === "production" && (jwtSecret.length < 32 || /replace|change-this|local-compose-secret/i.test(jwtSecret))) {
  throw new Error("Set a unique, random JWT_SECRET of at least 32 characters in production.");
}
