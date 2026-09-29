export interface ApiIssue {
  path: string;
  message: string;
}

/** A non-2xx response from the API, carrying its `{ error: { code, message } }` body. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues: ApiIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

/** Calls the API (proxied to /api by Vite) and returns the JSON body, or undefined for 204. */
export async function apiRequest(path: string, options: RequestOptions = {}): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const res = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (res.status === 204) return undefined;
  const data: unknown = await res.json().catch(() => null);
  if (res.ok) return data;

  const error = (data as { error?: { code?: string; message?: string; issues?: ApiIssue[] } })
    ?.error;
  throw new ApiError(
    res.status,
    error?.code ?? "unknown_error",
    error?.message ?? "Something went wrong. Please try again.",
    error?.issues ?? [],
  );
}
