import { describe, expect, it } from "vitest";
import { SetUserActive } from "../../../src/application/use-cases/setUserActive.js";
import { CannotDeactivateSelf, UserNotFound } from "../../../src/domain/identity/identityErrors.js";
import {
  FixedClock,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "../../support/fakes.js";

function setup() {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository(clock);
  const admin = users.add({ email: "admin@example.com", role: "admin" });
  return {
    clock,
    users,
    sessions,
    admin,
    setUserActive: new SetUserActive(users, sessions, clock),
  };
}

describe("SetUserActive", () => {
  it("deactivates a user and signs them out everywhere", async () => {
    const { clock, users, sessions, admin, setUserActive } = setup();
    const user = users.add({ email: "juan@example.com" });
    const session = await sessions.create({
      userId: user.id,
      expiresAt: new Date("2026-02-01T00:00:00Z"),
      ipAddress: null,
      userAgent: null,
    });

    const output = await setUserActive.execute({
      actorId: admin.id,
      userId: user.id,
      isActive: false,
    });

    expect(output.isActive).toBe(false);
    expect(users.users.get(user.id)?.isActive).toBe(false);
    expect(sessions.sessions.get(session.id)?.revokedAt).toEqual(clock.now());
  });

  it("reactivates a user", async () => {
    const { users, admin, setUserActive } = setup();
    const user = users.add({ email: "juan@example.com", isActive: false });

    const output = await setUserActive.execute({
      actorId: admin.id,
      userId: user.id,
      isActive: true,
    });

    expect(output.isActive).toBe(true);
  });

  it("won't let an admin deactivate themselves", async () => {
    const { users, admin, setUserActive } = setup();

    await expect(
      setUserActive.execute({ actorId: admin.id, userId: admin.id, isActive: false }),
    ).rejects.toThrow(CannotDeactivateSelf);
    expect(users.users.get(admin.id)?.isActive).toBe(true);
  });

  it("rejects an unknown user", async () => {
    const { admin, setUserActive } = setup();

    await expect(
      setUserActive.execute({
        actorId: admin.id,
        userId: "00000000-0000-4000-8000-000000000000",
        isActive: false,
      }),
    ).rejects.toThrow(UserNotFound);
  });
});
