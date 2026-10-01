import { Pool, type QueryResultRow } from "pg";
import { env } from "@/config/env";

export const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
pool.on("error", (error) => console.error("Unexpected idle database error", error));

export function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return pool.query<T>(text, values);
}
