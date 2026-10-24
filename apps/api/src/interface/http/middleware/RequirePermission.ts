import type { PermissionKey } from "@homelabconnect/shared";
import { PermissionDenied } from "../../../domain/access/accessErrors.js";
import type { HttpRequest, Middleware } from "../httpTypes.js";
import { requireAuth } from "./Authenticate.js";

/** Only lets users with the given permission through. Place after Authenticate. */
export class RequirePermission implements Middleware {
  constructor(private readonly permission: PermissionKey) {}

  async handle(request: HttpRequest): Promise<HttpRequest> {
    if (!requireAuth(request).permissions.has(this.permission)) throw new PermissionDenied();
    return request;
  }
}
