import { app } from "@/app";
import { env } from "@/config/env";
import { pool } from "@/config/database";
import { logger } from "@/utils/logger";

const server = app.listen(env.PORT, "0.0.0.0", () => logger.info("AssignmentOS API listening", { port: env.PORT, environment: env.NODE_ENV }));

async function shutdown(signal: string) {
  logger.info("API is shutting down", { signal });
  server.close(async () => { await pool.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
