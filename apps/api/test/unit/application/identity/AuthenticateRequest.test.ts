import { defaultBaseGrants } from "@homelabconnect/shared";
import { describe, expect, it } from "vitest";
import {
  AccountDeactivated,
  Unauthenticated,
  UserNotFound,
} from "../../../../src/domain/identity/identityErrors.js";
import {
  FixedClock,
  InMemoryAccessRepository,
  InMemoryUserRepository,
} from "../../../support/fakes.js";
import { AuthenticateRequest } from "../../../../src/application/identity/AuthenticateRequest.js";
import { GetCurrentUser } from "../../../../src/application/identity/GetCurrentUser.js";
import { ResolvePermissions } from "../../../../src/application/access/ResolvePermissions.js";

function setup() {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const user = users.add({ email: "doc@example.com", role: "doctor" });
  const access = new InMemoryAccessRepository();
  const permissions = new ResolvePermissions(access, clock);
  const authenticate = new AuthenticateRequest(users, permissions);
  const session = { userId: user.id, sessionId: "session-1" };
  return { users, access, permissions, user, session, authenticate };
}

describe("AuthenticateRequest", () => {
  it("returns who is signed in, with the role from the database", async () => {
    const { user, session, authenticate } = setup();

    await expect(authenticate.execute(session)).resolves.toEqual({
      userId: user.id,
      sessionId: "session-1",
      role: "doctor",
      mustChangePassword: false,
      permissions: new Set(defaultBaseGrants.doctor),
    });
  });

  it("resolves permissions fresh on every request", async () => {
    const { access, user, session, authenticate } = setup();
    expect((await authenticate.execute(session)).permissions.has("payments.view_all")).toBe(false);

    access.overrides.set(user.id, [{ key: "payments.view_all", effect: "grant", expiresAt: null }]);

    expect((await authenticate.execute(session)).permissions.has("payments.view_all")).toBe(true);
  });

  it("rejects a session whose user no longer exists", async () => {
    const { authenticate } = setup();
    await expect(authenticate.execute({ userId: "gone", sessionId: "session-1" })).rejects.toThrow(
      Unauthenticated,
    );
  });

  it("rejects a deactivated user even with a live session", async () => {
    const { users, user, session, authenticate } = setup();
    users.users.get(user.id)!.isActive = false;
    await expect(authenticate.execute(session)).rejects.toThrow(AccountDeactivated);
  });
});

describe("GetCurrentUser", () => {
  it("returns the user without the password hash", async () => {
    const { users, permissions, user } = setup();
    const output = await new GetCurrentUser(users, permissions).execute({ userId: user.id });
    expect(output).toEqual({
      id: user.id,
      email: "doc@example.com",
      role: "doctor",
      firstName: "Test",
      lastName: "User",
      mustChangePassword: false,
      photoUrl: null,
      permissions: [...defaultBaseGrants.doctor].sort(),
    });
  });

  it("fails for an unknown id", async () => {
    const { users, permissions } = setup();
    await expect(
      new GetCurrentUser(users, permissions).execute({ userId: "nope" }),
    ).rejects.toThrow(UserNotFound);
  });
});
