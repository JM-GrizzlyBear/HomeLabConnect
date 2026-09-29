import type { BaseRole } from "../../../domain/identity/baseRole.js";
import { RoleNotAllowed } from "../../../domain/identity/identityErrors.js";
import type { HttpRequest, Middleware } from "../httpTypes.js";
import { requireAuth } from "./authenticate.js";

/**
 * Only lets the given base roles through. Place after Authenticate.
 * Module 2 replaces this with per-permission checks.
 */
export class RequireBaseRole implements Middleware {
  private readonly roles: readonly BaseRole[];

  constructor(...roles: BaseRole[]) {
    this.roles = roles;
  }

  async handle(request: HttpRequest): Promise<HttpRequest> {
    const auth = requireAuth(request);
    if (!this.roles.includes(auth.role)) throw new RoleNotAllowed();
    return request;
  }
}
