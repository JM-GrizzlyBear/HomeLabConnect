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
  /** Sent as JSON, or as a multipart form when it's FormData (file uploads). */
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Calls the API and returns the JSON body, or undefined for 204. The browser sends the
 * session cookie by itself: /api is on the same address (Vite forwards it in development,
 * Netlify in production).
 */
export async function apiRequest(path: string, options: RequestOptions = {}): Promise<unknown> {
  const isForm = options.body instanceof FormData;
  const headers: Record<string, string> = {};
  // A form sets its own multipart Content-Type (with the boundary)
  if (options.body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: isForm
      ? (options.body as FormData)
      : options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (res.status === 204) return undefined;
  const data = await readJson(res);
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

/** The response body as JSON, or null when it isn't JSON (e.g. a proxy's HTML error page). */
async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
