import type { RecordAuditEntry } from "../../application/audit/RecordAuditEntry.js";
import type { Controller, HttpRequest, HttpResponse } from "./httpTypes.js";

export interface AuditOptions {
  /** What the action is done to, e.g. "role"; its id is the :id in the path or the new id. */
  target?: string;
  /** A short summary; by default a few telling fields of the request (name, email, …). */
  describe?(request: HttpRequest, response: HttpResponse | null): string | null;
  /** Who did it, when it isn't the signed-in user (sign-in: the user it returns). */
  actor?(request: HttpRequest, response: HttpResponse | null): string | null;
  /** Also record a refusal, as "<action>_failed" (sign-ins). */
  recordFailure?: boolean;
}

type Body = Record<string, unknown>;
const bodyOf = (value: unknown): Body =>
  value !== null && typeof value === "object" && !(value instanceof Uint8Array)
    ? (value as Body)
    : {};

// Fields worth showing in the log; passwords and files never are
const TELLING_FIELDS = [
  "name",
  "email",
  "code",
  "title",
  "firstName",
  "lastName",
  "active",
  "isActive",
  "decision",
  "reason",
];

/** "name: Team Makati · active: false", from the request body. */
function defaultSummary(request: HttpRequest): string | null {
  const body = bodyOf(request.body);
  const parts = TELLING_FIELDS.flatMap((key) => {
    const value = body[key];
    return (typeof value === "string" && value) || typeof value === "boolean"
      ? [`${key}: ${String(value).slice(0, 80)}`]
      : [];
  });
  return parts.length > 0 ? parts.join(" · ").slice(0, 300) : null;
}

function header(request: HttpRequest, name: string): string | null {
  const value = request.headers[name];
  return (Array.isArray(value) ? value[0] : value)?.slice(0, 300) ?? null;
}

/**
 * Wraps a controller so each successful call (and, when asked, each refusal) is written to the
 * audit log, without the use case knowing. A failure to write the log never fails the call.
 */
export class AuditedController implements Controller {
  constructor(
    private readonly inner: Controller,
    private readonly recordAuditEntry: RecordAuditEntry,
    private readonly action: string,
    private readonly options: AuditOptions = {},
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    let response: HttpResponse;
    try {
      response = await this.inner.handle(request);
    } catch (error) {
      if (this.options.recordFailure) await this.write(`${this.action}_failed`, request, null);
      throw error;
    }
    if (response.status < 300) await this.write(this.action, request, response);
    return response;
  }

  private async write(action: string, request: HttpRequest, response: HttpResponse | null) {
    const { target, describe = defaultSummary, actor } = this.options;
    const createdId = bodyOf(response?.body).id;
    await this.recordAuditEntry.execute({
      actorId: actor ? actor(request, response) : (request.auth?.userId ?? null),
      action,
      targetType: target ?? null,
      targetId: request.params.id ?? (typeof createdId === "string" ? createdId : null) ?? null,
      summary: describe(request, response),
      ip: request.ip,
      userAgent: header(request, "user-agent"),
    });
  }
}
