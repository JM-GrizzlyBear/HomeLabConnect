import type { AuthContext } from "../../application/identity/AuthenticateRequest.js";

/**
 * Framework-free request/response shapes. Controllers and presenters speak
 * these; the infrastructure layer translates them to and from Express.
 */
export interface HttpRequest<
  TBody = unknown,
  TParams extends Record<string, string> = Record<string, string>,
> {
  body: TBody;
  params: TParams;
  query: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  ip: string | null;
  /** The uploaded file of a multipart form (one per request), if any. */
  file?: { data: Uint8Array; size: number; filename: string };
  /** This browser's session: its id, and who is signed in on it (null for nobody). */
  session: { id: string; userId: string | null };
  /** Set by the Authenticate middleware. */
  auth?: AuthContext;
}

/** What to do with the browser's session once the controller succeeds. */
export type SessionChange = { signIn: string } | { signOut: true };

export interface HttpResponse<TBody = unknown> {
  status: number;
  /** Undefined means an empty response (e.g. 204). */
  body: TBody;
  session?: SessionChange;
  /**
   * Extra headers. A string or byte body is sent as is (a CSV, a file) instead of as JSON.
   */
  headers?: Record<string, string>;
  /** Sends the browser to this address instead (e.g. a short-lived file link). */
  redirect?: string;
}

export interface Controller {
  handle(request: HttpRequest): Promise<HttpResponse>;
}

/** Runs before a controller. Returns the (possibly enriched) request, or throws to stop it. */
export interface Middleware {
  handle(request: HttpRequest): Promise<HttpRequest>;
}
