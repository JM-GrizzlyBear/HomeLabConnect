import { describe, expect, it } from "vitest";
import { Email } from "./email.js";
import { InvalidEmail, WeakPassword } from "./identityErrors.js";
import { assertPasswordIsStrong } from "./passwordPolicy.js";
import { isSessionActive, type Session } from "./session.js";

describe("Email", () => {
  it("normalises case and surrounding spaces", () => {
    expect(Email.of("  Juan@Example.COM ").value).toBe("juan@example.com");
  });

  it.each(["", "juan", "juan@", "@example.com", "juan@example", "ju an@example.com"])(
    "rejects %j",
    (raw) => {
      expect(() => Email.of(raw)).toThrow(InvalidEmail);
    },
  );
});

describe("assertPasswordIsStrong", () => {
  it("accepts 8+ characters with a letter and a number", () => {
    expect(() => assertPasswordIsStrong("Password123")).not.toThrow();
  });

  it.each([
    ["too short", "abc123"],
    ["no number", "abcdefgh"],
    ["no letter", "12345678"],
    ["over 72 bytes", `a1${"x".repeat(71)}`],
  ])("rejects a password with %s", (_reason, password) => {
    expect(() => assertPasswordIsStrong(password)).toThrow(WeakPassword);
  });
});

describe("isSessionActive", () => {
  const now = new Date("2026-01-15T08:00:00Z");
  const session = (overrides: Partial<Session>): Session => ({
    id: "s1",
    userId: "u1",
    createdAt: new Date("2026-01-15T07:00:00Z"),
    expiresAt: new Date("2026-01-15T09:00:00Z"),
    revokedAt: null,
    ...overrides,
  });

  it("is active before expiry when not revoked", () => {
    expect(isSessionActive(session({}), now)).toBe(true);
  });

  it("is inactive once expired", () => {
    expect(isSessionActive(session({ expiresAt: now }), now)).toBe(false);
  });

  it("is inactive once revoked", () => {
    expect(isSessionActive(session({ revokedAt: now }), now)).toBe(false);
  });
});
