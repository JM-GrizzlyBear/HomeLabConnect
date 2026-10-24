import { describe, expect, it } from "vitest";
import { ChangePassword } from "../../../../src/application/identity/ChangePassword.js";
import { ResolvePermissions } from "../../../../src/application/access/ResolvePermissions.js";
import {
  IncorrectCurrentPassword,
  PasswordUnchanged,
  TemporaryPasswordExpired,
  WeakPassword,
} from "../../../../src/domain/identity/identityErrors.js";
import {
  FakePasswordHasher,
  FixedClock,
  InMemoryAccessRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "../../../support/fakes.js";

function setup() {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository();
  const changePassword = new ChangePassword(
    users,
    sessions,
    new FakePasswordHasher(),
    clock,
    new ResolvePermissions(new InMemoryAccessRepository(), clock),
  );
  return { clock, users, sessions, changePassword };
}

describe("ChangePassword", () => {
  it("stores the new password and clears the temporary-password flag", async () => {
    const { users, sessions, changePassword } = setup();
    const user = users.add({ email: "new@example.com", role: "support", mustChangePassword: true });
    const current = sessions.add(user.id);

    const output = await changePassword.execute({
      userId: user.id,
      sessionId: current,
      currentPassword: "Password123",
      newPassword: "NewPassword456",
    });

    expect(output.mustChangePassword).toBe(false);
    expect(users.users.get(user.id)?.passwordHash).toBe("hashed:NewPassword456");
  });

  it("clears the temporary password expiry", async () => {
    const { clock, users, sessions, changePassword } = setup();
    const user = users.add({
      email: "new@example.com",
      role: "support",
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(clock.now().getTime() + 60_000),
    });
    const current = sessions.add(user.id);

    await changePassword.execute({
      userId: user.id,
      sessionId: current,
      currentPassword: "Password123",
      newPassword: "NewPassword456",
    });

    expect(users.users.get(user.id)?.temporaryPasswordExpiresAt).toBeNull();
  });

  it("rejects an expired temporary password and changes nothing", async () => {
    const { clock, users, sessions, changePassword } = setup();
    const user = users.add({
      email: "new@example.com",
      role: "support",
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(clock.now().getTime() + 60_000),
    });
    const current = sessions.add(user.id);
    clock.advanceMinutes(2);

    await expect(
      changePassword.execute({
        userId: user.id,
        sessionId: current,
        currentPassword: "Password123",
        newPassword: "NewPassword456",
      }),
    ).rejects.toThrow(TemporaryPasswordExpired);
    expect(users.users.get(user.id)?.passwordHash).toBe("hashed:Password123");
  });

  it("signs out other sessions but keeps the current one", async () => {
    const { users, sessions, changePassword } = setup();
    const user = users.add({ email: "juan@example.com" });
    const current = sessions.add(user.id);
    const other = sessions.add(user.id);
    const someoneElse = sessions.add(users.add({ email: "ana@example.com" }).id);

    await changePassword.execute({
      userId: user.id,
      sessionId: current,
      currentPassword: "Password123",
      newPassword: "NewPassword456",
    });

    expect(sessions.isOpen(current)).toBe(true);
    expect(sessions.isOpen(other)).toBe(false);
    expect(sessions.isOpen(someoneElse)).toBe(true);
  });

  it("rejects a wrong current password and changes nothing", async () => {
    const { users, sessions, changePassword } = setup();
    const user = users.add({ email: "juan@example.com" });
    const current = sessions.add(user.id);

    await expect(
      changePassword.execute({
        userId: user.id,
        sessionId: current,
        currentPassword: "Wrong1234",
        newPassword: "NewPassword456",
      }),
    ).rejects.toThrow(IncorrectCurrentPassword);
    expect(users.users.get(user.id)?.passwordHash).toBe("hashed:Password123");
  });

  it("rejects a weak or unchanged new password", async () => {
    const { users, sessions, changePassword } = setup();
    const user = users.add({ email: "juan@example.com" });
    const current = sessions.add(user.id);
    const input = { userId: user.id, sessionId: current, currentPassword: "Password123" };

    await expect(changePassword.execute({ ...input, newPassword: "short" })).rejects.toThrow(
      WeakPassword,
    );
    await expect(changePassword.execute({ ...input, newPassword: "Password123" })).rejects.toThrow(
      PasswordUnchanged,
    );
  });
});
