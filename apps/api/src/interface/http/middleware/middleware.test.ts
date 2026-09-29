import { describe, expect, it } from "vitest";
import type { AuthContext } from "../../../application/use-cases/authenticateRequest.js";
import { AuthenticateRequest } from "../../../application/use-cases/authenticateRequest.js";
import {
  PasswordChangeRequired,
  RoleNotAllowed,
  Unauthenticated,
} from "../../../domain/identity/identityErrors.js";
import {
  FakeTokenService,
  FixedClock,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "../../../test/fakes.js";
import type { HttpRequest } from "../httpTypes.js";
import { Authenticate } from "./authenticate.js";
import { RequireBaseRole } from "./requireBaseRole.js";

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
    authenticateRequest: new AuthenticateRequest(tokens, sessions, users, clock),
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

describe("RequireBaseRole", () => {
  const auth = (role: AuthContext["role"]): AuthContext => ({
    userId: "u1",
    sessionId: "s1",
    role,
    mustChangePassword: false,
  });

  it("lets listed roles through", async () => {
    const req = request({ auth: auth("admin") });
    await expect(new RequireBaseRole("admin", "support").handle(req)).resolves.toBe(req);
  });

  it("rejects other roles", async () => {
    await expect(
      new RequireBaseRole("admin").handle(request({ auth: auth("patient") })),
    ).rejects.toThrow(RoleNotAllowed);
  });

  it("rejects an unauthenticated request", async () => {
    await expect(new RequireBaseRole("admin").handle(request())).rejects.toThrow(Unauthenticated);
  });
});
