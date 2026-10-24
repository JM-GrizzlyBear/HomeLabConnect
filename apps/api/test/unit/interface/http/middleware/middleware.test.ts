import { describe, expect, it } from "vitest";
import type { AuthContext } from "../../../../../src/application/identity/AuthenticateRequest.js";
import { AuthenticateRequest } from "../../../../../src/application/identity/AuthenticateRequest.js";
import { ResolvePermissions } from "../../../../../src/application/access/ResolvePermissions.js";
import { PermissionDenied } from "../../../../../src/domain/access/accessErrors.js";
import {
  PasswordChangeRequired,
  Unauthenticated,
} from "../../../../../src/domain/identity/identityErrors.js";
import {
  FixedClock,
  InMemoryAccessRepository,
  InMemoryUserRepository,
} from "../../../../support/fakes.js";
import type { HttpRequest } from "../../../../../src/interface/http/httpTypes.js";
import { Authenticate } from "../../../../../src/interface/http/middleware/Authenticate.js";
import { RequirePermission } from "../../../../../src/interface/http/middleware/RequirePermission.js";

const request = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  body: undefined,
  params: {},
  query: {},
  headers: {},
  ip: null,
  session: { id: "s1", userId: null },
  ...overrides,
});

function signedIn({ mustChangePassword = false } = {}) {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const user = users.add({ email: "staff@example.com", role: "support", mustChangePassword });
  return {
    authenticateRequest: new AuthenticateRequest(
      users,
      new ResolvePermissions(new InMemoryAccessRepository(), clock),
    ),
    session: { id: "s1", userId: user.id },
  };
}

describe("Authenticate", () => {
  it("attaches the AuthContext for a signed-in session", async () => {
    const { authenticateRequest, session } = signedIn();
    const result = await new Authenticate(authenticateRequest).handle(request({ session }));
    expect(result.auth).toMatchObject({ role: "support", sessionId: "s1" });
  });

  it("rejects a session nobody is signed in on", async () => {
    const { authenticateRequest } = signedIn();
    await expect(new Authenticate(authenticateRequest).handle(request())).rejects.toThrow(
      Unauthenticated,
    );
  });

  it("blocks a temporary password unless the route allows it", async () => {
    const { authenticateRequest, session } = signedIn({ mustChangePassword: true });
    const req = request({ session });

    await expect(new Authenticate(authenticateRequest).handle(req)).rejects.toThrow(
      PasswordChangeRequired,
    );
    const allowed = await new Authenticate(authenticateRequest, {
      allowPendingPasswordChange: true,
    }).handle(req);
    expect(allowed.auth?.mustChangePassword).toBe(true);
  });
});

describe("RequirePermission", () => {
  const auth = (...permissions: string[]): AuthContext => ({
    userId: "u1",
    sessionId: "s1",
    role: "support",
    mustChangePassword: false,
    permissions: new Set(permissions),
  });

  it("lets users with the permission through", async () => {
    const req = request({ auth: auth("users.view", "users.create") });
    await expect(new RequirePermission("users.create").handle(req)).resolves.toBe(req);
  });

  it("rejects users without it", async () => {
    await expect(
      new RequirePermission("users.create").handle(request({ auth: auth("users.view") })),
    ).rejects.toThrow(PermissionDenied);
  });

  it("rejects an unauthenticated request", async () => {
    await expect(new RequirePermission("users.view").handle(request())).rejects.toThrow(
      Unauthenticated,
    );
  });
});
