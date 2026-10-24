import { describe, expect, it } from "vitest";
import { assertPasswordIsStrong } from "../../../../src/domain/identity/passwordPolicy.js";
import { CryptoTemporaryPasswordGenerator } from "../../../../src/infrastructure/auth/CryptoTemporaryPasswordGenerator.js";

describe("CryptoTemporaryPasswordGenerator", () => {
  it("makes 12-character passwords that pass the password policy", () => {
    const generator = new CryptoTemporaryPasswordGenerator();
    for (let i = 0; i < 200; i++) {
      const password = generator.generate();
      expect(password).toHaveLength(12);
      expect(password).not.toMatch(/[0O1lI]/);
      expect(() => assertPasswordIsStrong(password)).not.toThrow();
    }
  });

  it("doesn't repeat itself", () => {
    const generator = new CryptoTemporaryPasswordGenerator();
    const passwords = new Set(Array.from({ length: 100 }, () => generator.generate()));
    expect(passwords.size).toBe(100);
  });
});
