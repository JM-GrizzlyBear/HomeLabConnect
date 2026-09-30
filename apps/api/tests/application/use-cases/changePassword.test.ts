import { describe, expect, it } from "vitest";
import { ChangePassword } from "../../../src/application/use-cases/changePassword.js";
import {
  IncorrectCurrentPassword,
  PasswordUnchanged,
  WeakPassword,
} from "../../../src/domain/identity/identityErrors.js";
import {
  FakePasswordHasher,
  FixedClock,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "../../support/fakes.js";

function setup() {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository(clock);
  const changePassword = new ChangePassword(users, sessions, new FakePasswordHasher(), clock);
  return { clock, users, sessions, changePassword };
}

async function openSession(sessions: InMemorySessionRepository, userId: string) {
  return sessions.create({
    userId,
    expiresAt: new Date("2026-02-01T00:00:00Z"),
    ipAddress: null,
    userAgent: null,
  });
}

describe("ChangePassword", () => {
  it("stores the new password and clears the temporary-password flag", async () => {
    const { users, sessions, changePassword } = setup();
    const user = users.add({ email: "new@example.com", role: "support", mustChangePassword: true });
    const current = await openSession(sessions, user.id);

    const output = await changePassword.execute({
      userId: user.id,
      sessionId: current.id,
      currentPassword: "Password123",
      newPassword: "NewPassword456",
    });

    expect(output.mustChangePassword).toBe(false);
    expect(users.users.get(user.id)?.passwordHash).toBe("hashed:NewPassword456");
  });

  it("signs out other sessions but keeps the current one", async () => {
    const { clock, users, sessions, changePassword } = setup();
    const user = users.add({ email: "juan@example.com" });
    const current = await openSession(sessions, user.id);
    const other = await openSession(sessions, user.id);
    const someoneElse = await openSession(sessions, users.add({ email: "ana@example.com" }).id);

    await changePassword.execute({
      userId: user.id,
      sessionId: current.id,
      currentPassword: "Password123",
      newPassword: "NewPassword456",
    });

    expect(sessions.sessions.get(current.id)?.revokedAt).toBeNull();
    expect(sessions.sessions.get(other.id)?.revokedAt).toEqual(clock.now());
    expect(sessions.sessions.get(someoneElse.id)?.revokedAt).toBeNull();
  });

  it("rejects a wrong current password and changes nothing", async () => {
    const { users, sessions, changePassword } = setup();
    const user = users.add({ email: "juan@example.com" });
    const current = await openSession(sessions, user.id);

    await expect(
      changePassword.execute({
        userId: user.id,
        sessionId: current.id,
        currentPassword: "Wrong1234",
        newPassword: "NewPassword456",
      }),
    ).rejects.toThrow(IncorrectCurrentPassword);
    expect(users.users.get(user.id)?.passwordHash).toBe("hashed:Password123");
  });

  it("rejects a weak or unchanged new password", async () => {
    const { users, sessions, changePassword } = setup();
    const user = users.add({ email: "juan@example.com" });
    const current = await openSession(sessions, user.id);
    const input = { userId: user.id, sessionId: current.id, currentPassword: "Password123" };

    await expect(changePassword.execute({ ...input, newPassword: "short" })).rejects.toThrow(
      WeakPassword,
    );
    await expect(changePassword.execute({ ...input, newPassword: "Password123" })).rejects.toThrow(
      PasswordUnchanged,
    );
  });
});
