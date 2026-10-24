import { defaultBaseGrants } from "@homelabconnect/shared";
import { describe, expect, it } from "vitest";
import {
  AccountDeactivated,
  Unauthenticated,
  UserNotFound,
} from "../../../src/domain/identity/identityErrors.js";
import {
  FakeTokenService,
  FixedClock,
  InMemoryAccessRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "../../support/fakes.js";
import { AuthenticateRequest } from "../../../src/application/use-cases/authenticateRequest.js";
import { GetCurrentUser } from "../../../src/application/use-cases/getCurrentUser.js";
import { ResolvePermissions } from "../../../src/application/use-cases/resolvePermissions.js";

async function setup() {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository(clock);
  const tokens = new FakeTokenService();
  const user = users.add({ email: "doc@example.com", role: "doctor" });
  const session = await sessions.create({
    userId: user.id,
    expiresAt: new Date(clock.now().getTime() + 60 * 60_000),
    ipAddress: null,
    userAgent: null,
  });
  const token = tokens.issue({ userId: user.id, sessionId: session.id });
  const access = new InMemoryAccessRepository();
  const permissions = new ResolvePermissions(access, clock);
  const authenticate = new AuthenticateRequest(tokens, sessions, users, clock, permissions);
  return {
    clock,
    users,
    sessions,
    tokens,
    access,
    permissions,
    user,
    session,
    token,
    authenticate,
  };
}

describe("AuthenticateRequest", () => {
  it("returns who is signed in, with the role from the database", async () => {
    const { user, session, token, authenticate } = await setup();

    await expect(authenticate.execute({ token })).resolves.toEqual({
      userId: user.id,
      sessionId: session.id,
      role: "doctor",
      mustChangePassword: false,
      permissions: new Set(defaultBaseGrants.doctor),
    });
  });

  it("resolves permissions fresh on every request", async () => {
    const { access, user, token, authenticate } = await setup();
    expect((await authenticate.execute({ token })).permissions.has("payments.view_all")).toBe(
      false,
    );

    access.overrides.set(user.id, [{ key: "payments.view_all", effect: "grant", expiresAt: null }]);

    expect((await authenticate.execute({ token })).permissions.has("payments.view_all")).toBe(true);
  });

  it("rejects a token that doesn't verify", async () => {
    const { authenticate } = await setup();
    await expect(authenticate.execute({ token: "garbage" })).rejects.toThrow(Unauthenticated);
  });

  it("rejects a revoked session", async () => {
    const { clock, sessions, session, token, authenticate } = await setup();
    await sessions.revoke(session.id, clock.now());
    await expect(authenticate.execute({ token })).rejects.toThrow(Unauthenticated);
  });

  it("rejects an expired session", async () => {
    const { clock, token, authenticate } = await setup();
    clock.advanceMinutes(61);
    await expect(authenticate.execute({ token })).rejects.toThrow(Unauthenticated);
  });

  it("rejects a token whose session belongs to someone else", async () => {
    const { users, session, tokens, authenticate } = await setup();
    const other = users.add({ email: "other@example.com" });
    const forged = tokens.issue({ userId: other.id, sessionId: session.id });
    await expect(authenticate.execute({ token: forged })).rejects.toThrow(Unauthenticated);
  });

  it("rejects a deactivated user even with a live session", async () => {
    const { users, user, token, authenticate } = await setup();
    users.users.get(user.id)!.isActive = false;
    await expect(authenticate.execute({ token })).rejects.toThrow(AccountDeactivated);
  });
});

describe("GetCurrentUser", () => {
  it("returns the user without the password hash", async () => {
    const { users, permissions, user } = await setup();
    const output = await new GetCurrentUser(users, permissions).execute({ userId: user.id });
    expect(output).toEqual({
      id: user.id,
      email: "doc@example.com",
      role: "doctor",
      firstName: "Test",
      lastName: "User",
      mustChangePassword: false,
      permissions: [...defaultBaseGrants.doctor].sort(),
    });
  });

  it("fails for an unknown id", async () => {
    const { users, permissions } = await setup();
    await expect(
      new GetCurrentUser(users, permissions).execute({ userId: "nope" }),
    ).rejects.toThrow(UserNotFound);
  });
});
