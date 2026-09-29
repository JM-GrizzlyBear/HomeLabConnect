import { describe, expect, it } from "vitest";
import { AccountDeactivated, InvalidCredentials } from "../../domain/identity/identityErrors.js";
import {
  FakePasswordHasher,
  FakeTokenService,
  FixedClock,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "../../test/fakes.js";
import { Login } from "./login.js";
import { Logout } from "./logout.js";

function setup() {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository(clock);
  const tokens = new FakeTokenService();
  const login = new Login(users, sessions, new FakePasswordHasher(), tokens, clock, {
    sessionTtlMinutes: 60,
  });
  return { clock, users, sessions, tokens, login, logout: new Logout(sessions, clock) };
}

const credentials = { password: "Password123", ipAddress: "127.0.0.1", userAgent: "vitest" };

describe("Login", () => {
  it("opens a session and returns a token tied to it", async () => {
    const { clock, users, sessions, tokens, login } = setup();
    const user = users.add({ email: "juan@example.com" });

    const output = await login.execute({ ...credentials, email: "JUAN@example.com" });

    expect(output.user.id).toBe(user.id);
    expect(output.expiresAt).toEqual(new Date(clock.now().getTime() + 60 * 60_000));
    const claims = tokens.verify(output.token);
    expect(claims?.userId).toBe(user.id);
    expect(sessions.sessions.get(claims!.sessionId)).toMatchObject({ userId: user.id });
    expect(users.lastSignIn.get(user.id)).toEqual(clock.now());
  });

  it("rejects a wrong password", async () => {
    const { users, login } = setup();
    users.add({ email: "juan@example.com" });

    await expect(
      login.execute({ ...credentials, email: "juan@example.com", password: "Wrong123" }),
    ).rejects.toThrow(InvalidCredentials);
  });

  it("rejects an unknown or malformed email the same way", async () => {
    const { login } = setup();

    await expect(login.execute({ ...credentials, email: "nobody@example.com" })).rejects.toThrow(
      InvalidCredentials,
    );
    await expect(login.execute({ ...credentials, email: "not-an-email" })).rejects.toThrow(
      InvalidCredentials,
    );
  });

  it("rejects a deactivated account and opens no session", async () => {
    const { users, sessions, login } = setup();
    users.add({ email: "juan@example.com", isActive: false });

    await expect(login.execute({ ...credentials, email: "juan@example.com" })).rejects.toThrow(
      AccountDeactivated,
    );
    expect(sessions.sessions.size).toBe(0);
  });
});

describe("Logout", () => {
  it("revokes the session", async () => {
    const { clock, users, sessions, tokens, login, logout } = setup();
    users.add({ email: "juan@example.com" });
    const { token } = await login.execute({ ...credentials, email: "juan@example.com" });
    const sessionId = tokens.verify(token)!.sessionId;

    await logout.execute({ sessionId });

    expect(sessions.sessions.get(sessionId)?.revokedAt).toEqual(clock.now());
  });
});
