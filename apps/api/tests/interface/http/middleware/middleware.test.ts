import { describe, expect, it } from "vitest";
import type { AuthContext } from "../../../../src/application/use-cases/authenticateRequest.js";
import { AuthenticateRequest } from "../../../../src/application/use-cases/authenticateRequest.js";
import { ResolvePermissions } from "../../../../src/application/use-cases/resolvePermissions.js";
import { PermissionDenied } from "../../../../src/domain/access/accessErrors.js";
import {
  PasswordChangeRequired,
  Unauthenticated,
} from "../../../../src/domain/identity/identityErrors.js";
import {
  FakeTokenService,
  FixedClock,
  InMemoryAccessRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "../../../support/fakes.js";
import type { HttpRequest } from "../../../../src/interface/http/httpTypes.js";
import { Authenticate } from "../../../../src/interface/http/middleware/authenticate.js";
import { RequirePermission } from "../../../../src/interface/http/middleware/requirePermission.js";

const request = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  body: undefined,
  params: {},
  query: {},
  headers: {},
  ip: null,
  ...overrides,
});

async function signedIn({ mustChangePassword = false } = {}) {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository(clock);
  const tokens = new FakeTokenService();
  const user = users.add({ email: "staff@example.com", role: "support", mustChangePassword });
  const session = await sessions.create({
    userId: user.id,
    expiresAt: new Date(clock.now().getTime() + 60_000),
    ipAddress: null,
    userAgent: null,
  });
  return {
    authenticateRequest: new AuthenticateRequest(
      tokens,
      sessions,
      users,
      clock,
      new ResolvePermissions(new InMemoryAccessRepository(), clock),
    ),
    authorization: `Bearer ${tokens.issue({ userId: user.id, sessionId: session.id })}`,
  };
}

describe("Authenticate", () => {
  it("attaches the AuthContext for a valid bearer token", async () => {
    const { authenticateRequest, authorization } = await signedIn();
    const result = await new Authenticate(authenticateRequest).handle(
      request({ headers: { authorization } }),
    );
    expect(result.auth?.role).toBe("support");
  });

  it.each([undefined, "", "Basic abc", "Bearer"])(
    "rejects authorization header %j",
    async (authorization) => {
      const { authenticateRequest } = await signedIn();
      await expect(
        new Authenticate(authenticateRequest).handle(request({ headers: { authorization } })),
      ).rejects.toThrow(Unauthenticated);
    },
  );

  it("blocks a temporary password unless the route allows it", async () => {
    const { authenticateRequest, authorization } = await signedIn({ mustChangePassword: true });
    const req = request({ headers: { authorization } });

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
