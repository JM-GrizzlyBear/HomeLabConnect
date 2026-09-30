import { describe, expect, it } from "vitest";
import { ReissueTemporaryPassword } from "../../../src/application/use-cases/reissueTemporaryPassword.js";
import { AccountDeactivated, UserNotFound } from "../../../src/domain/identity/identityErrors.js";
import {
  FakeAccountEmails,
  FakePasswordHasher,
  FakeTemporaryPasswordGenerator,
  FixedClock,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "../../support/fakes.js";

function setup() {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository(clock);
  const emails = new FakeAccountEmails();
  const reissue = new ReissueTemporaryPassword(
    users,
    sessions,
    new FakePasswordHasher(),
    new FakeTemporaryPasswordGenerator(),
    emails,
    clock,
  );
  return { clock, users, sessions, emails, reissue };
}

describe("ReissueTemporaryPassword", () => {
  it("replaces an expired temporary password with a new one valid for 7 more days", async () => {
    const { clock, users, emails, reissue } = setup();
    const user = users.add({
      email: "ana@example.com",
      role: "support",
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date("2026-01-01T00:00:00Z"),
    });

    const output = await reissue.execute({ userId: user.id });

    expect(users.users.get(user.id)).toMatchObject({
      passwordHash: "hashed:Temp0001",
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date("2026-01-22T08:00:00Z"),
    });
    expect(output).toMatchObject({ emailSent: true, temporaryPassword: null });
    expect(emails.sent).toEqual([
      expect.objectContaining({
        kind: "reissued",
        to: "ana@example.com",
        temporaryPassword: "Temp0001",
        expiresAt: new Date(clock.now().getTime() + 7 * 24 * 60 * 60_000),
      }),
    ]);
  });

  it("works for a user who already set a permanent password", async () => {
    const { users, reissue } = setup();
    const user = users.add({ email: "juan@example.com" });

    const output = await reissue.execute({ userId: user.id });

    expect(output.user.mustChangePassword).toBe(true);
  });

  it("signs the user out everywhere", async () => {
    const { clock, users, sessions, reissue } = setup();
    const user = users.add({ email: "ana@example.com", role: "support" });
    const session = await sessions.create({
      userId: user.id,
      expiresAt: new Date("2026-02-01T00:00:00Z"),
      ipAddress: null,
      userAgent: null,
    });

    await reissue.execute({ userId: user.id });

    expect(sessions.sessions.get(session.id)?.revokedAt).toEqual(clock.now());
  });

  it("returns the password to the admin when the email fails", async () => {
    const { users, emails, reissue } = setup();
    const user = users.add({ email: "ana@example.com", role: "support" });
    emails.failing = true;

    const output = await reissue.execute({ userId: user.id });

    expect(output).toMatchObject({ emailSent: false, temporaryPassword: "Temp0001" });
  });

  it("rejects a deactivated or unknown user", async () => {
    const { users, reissue } = setup();
    const inactive = users.add({ email: "ana@example.com", isActive: false });

    await expect(reissue.execute({ userId: inactive.id })).rejects.toThrow(AccountDeactivated);
    await expect(
      reissue.execute({ userId: "00000000-0000-4000-8000-000000000000" }),
    ).rejects.toThrow(UserNotFound);
    expect(users.users.get(inactive.id)?.passwordHash).toBe("hashed:Password123");
  });
});
