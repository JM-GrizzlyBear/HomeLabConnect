import { describe, expect, it } from "vitest";
import {
  AccountDeactivated,
  Unauthenticated,
  UserNotFound,
} from "../../domain/identity/identityErrors.js";
import {
  FakeTokenService,
  FixedClock,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "../../test/fakes.js";
import { AuthenticateRequest } from "./authenticateRequest.js";
import { GetCurrentUser } from "./getCurrentUser.js";

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
  const authenticate = new AuthenticateRequest(tokens, sessions, users, clock);
  return { clock, users, sessions, tokens, user, session, token, authenticate };
}

describe("AuthenticateRequest", () => {
  it("returns who is signed in, with the role from the database", async () => {
    const { user, session, token, authenticate } = await setup();

    await expect(authenticate.execute({ token })).resolves.toEqual({
      userId: user.id,
      sessionId: session.id,
      role: "doctor",
      mustChangePassword: false,
    });
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
    const { users, user } = await setup();
    const output = await new GetCurrentUser(users).execute({ userId: user.id });
    expect(output).toEqual({
      id: user.id,
      email: "doc@example.com",
      role: "doctor",
      firstName: "Test",
      lastName: "User",
      mustChangePassword: false,
    });
  });

  it("fails for an unknown id", async () => {
    const { users } = await setup();
    await expect(new GetCurrentUser(users).execute({ userId: "nope" })).rejects.toThrow(
      UserNotFound,
    );
  });
});
