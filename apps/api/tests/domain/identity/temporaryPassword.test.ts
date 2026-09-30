import { describe, expect, it } from "vitest";
import { TemporaryPasswordExpired } from "../../../src/domain/identity/identityErrors.js";
import { temporaryPasswordExpiry } from "../../../src/domain/identity/temporaryPassword.js";
import { User, type UserProps } from "../../../src/domain/identity/user.js";

const now = new Date("2026-01-15T08:00:00Z");

function user(overrides: Partial<UserProps>): User {
  return User.restore({
    id: "u1",
    email: "staff@example.com",
    passwordHash: "hash",
    role: "support",
    firstName: "Ana",
    lastName: "Reyes",
    phone: null,
    mustChangePassword: true,
    temporaryPasswordExpiresAt: null,
    customRoleId: null,
    isActive: true,
    ...overrides,
  });
}

describe("temporaryPasswordExpiry", () => {
  it("is 7 days after it was issued", () => {
    expect(temporaryPasswordExpiry(now)).toEqual(new Date("2026-01-22T08:00:00Z"));
  });
});

describe("User.assertTemporaryPasswordValid", () => {
  it("accepts a temporary password before it expires", () => {
    const expiresAt = new Date(now.getTime() + 1);
    expect(() =>
      user({ temporaryPasswordExpiresAt: expiresAt }).assertTemporaryPasswordValid(now),
    ).not.toThrow();
  });

  it("rejects a temporary password from the moment it expires", () => {
    expect(() =>
      user({ temporaryPasswordExpiresAt: now }).assertTemporaryPasswordValid(now),
    ).toThrow(TemporaryPasswordExpired);
  });

  it("ignores the expiry once the password is permanent", () => {
    const expired = new Date(now.getTime() - 1);
    expect(() =>
      user({
        mustChangePassword: false,
        temporaryPasswordExpiresAt: expired,
      }).assertTemporaryPasswordValid(now),
    ).not.toThrow();
  });

  it("accepts a temporary password with no expiry on record", () => {
    expect(() => user({}).assertTemporaryPasswordValid(now)).not.toThrow();
  });
});
