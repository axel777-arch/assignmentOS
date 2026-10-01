export const logger = {
  info(message: string, fields?: Record<string, unknown>) { console.log(JSON.stringify({ level: "info", message, ...fields, timestamp: new Date().toISOString() })); },
  error(message: string, error?: unknown) { console.error(JSON.stringify({ level: "error", message, detail: error instanceof Error ? error.message : error, timestamp: new Date().toISOString() })); }
};
