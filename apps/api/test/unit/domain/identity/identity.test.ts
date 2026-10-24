import { describe, expect, it } from "vitest";
import { Email } from "../../../../src/domain/identity/email.js";
import { InvalidEmail, WeakPassword } from "../../../../src/domain/identity/identityErrors.js";
import { assertPasswordIsStrong } from "../../../../src/domain/identity/passwordPolicy.js";

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
