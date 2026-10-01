export class HttpError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "HttpError"; }
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
