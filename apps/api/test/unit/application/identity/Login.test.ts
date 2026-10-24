import { describe, expect, it } from "vitest";
import {
  AccountDeactivated,
  InvalidCredentials,
  TemporaryPasswordExpired,
} from "../../../../src/domain/identity/identityErrors.js";
import {
  FakePasswordHasher,
  FixedClock,
  InMemoryAccessRepository,
  InMemoryUserRepository,
} from "../../../support/fakes.js";
import { Login } from "../../../../src/application/identity/Login.js";
import { ResolvePermissions } from "../../../../src/application/access/ResolvePermissions.js";

function setup() {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const permissions = new ResolvePermissions(new InMemoryAccessRepository(), clock);
  const login = new Login(users, new FakePasswordHasher(), clock, permissions);
  return { clock, users, login };
}

const credentials = { password: "Password123" };

describe("Login", () => {
  it("returns the user and their permissions, and records the sign-in", async () => {
    const { clock, users, login } = setup();
    const user = users.add({ email: "juan@example.com", role: "support" });

    const output = await login.execute({ ...credentials, email: "JUAN@example.com" });

    expect(output.user.id).toBe(user.id);
    expect(output.user.permissions).toContain("users.view");
    expect(users.lastSignIn.get(user.id)).toEqual(clock.now());
  });

  it("rejects a wrong password", async () => {
    const { users, login } = setup();
    users.add({ email: "juan@example.com" });

    await expect(
      login.execute({ email: "juan@example.com", password: "Wrong123" }),
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

  it("rejects a deactivated account without recording a sign-in", async () => {
    const { users, login } = setup();
    const user = users.add({ email: "juan@example.com", isActive: false });

    await expect(login.execute({ ...credentials, email: "juan@example.com" })).rejects.toThrow(
      AccountDeactivated,
    );
    expect(users.lastSignIn.has(user.id)).toBe(false);
  });

  it("rejects an expired temporary password, but only once the password matches", async () => {
    const { clock, users, login } = setup();
    users.add({
      email: "new@example.com",
      role: "support",
      mustChangePassword: true,
      temporaryPasswordExpiresAt: clock.now(),
    });

    await expect(login.execute({ ...credentials, email: "new@example.com" })).rejects.toThrow(
      TemporaryPasswordExpired,
    );
    await expect(login.execute({ email: "new@example.com", password: "Wrong123" })).rejects.toThrow(
      InvalidCredentials,
    );
  });

  it("accepts a temporary password before it expires", async () => {
    const { clock, users, login } = setup();
    users.add({
      email: "new@example.com",
      role: "support",
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(clock.now().getTime() + 60_000),
    });

    const output = await login.execute({ ...credentials, email: "new@example.com" });

    expect(output.user.mustChangePassword).toBe(true);
  });
});
