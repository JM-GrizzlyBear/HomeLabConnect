import type { AuthContext } from "../../application/use-cases/authenticateRequest.js";

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
  /** Set by the Authenticate middleware. */
  auth?: AuthContext;
}

export interface HttpResponse<TBody = unknown> {
  status: number;
  /** Undefined means an empty response (e.g. 204). */
  body: TBody;
}

export interface Controller {
  handle(request: HttpRequest): Promise<HttpResponse>;
}

/** Runs before a controller. Returns the (possibly enriched) request, or throws to stop it. */
export interface Middleware {
  handle(request: HttpRequest): Promise<HttpRequest>;
}
