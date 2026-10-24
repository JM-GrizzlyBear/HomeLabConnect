import { randomInt } from "node:crypto";
import type { TemporaryPasswordGenerator } from "../../application/ports/TemporaryPasswordGenerator.js";

// No look-alikes (0/O/o, 1/l/I), so the password is easy to read from an email or type in.
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const ALPHABET = LETTERS + DIGITS;

/** 12 random characters from a CSPRNG, always with at least one letter and one digit. */
export class CryptoTemporaryPasswordGenerator implements TemporaryPasswordGenerator {
  constructor(private readonly length = 12) {}

  generate(): string {
    for (;;) {
      const password = Array.from(
        { length: this.length },
        () => ALPHABET[randomInt(ALPHABET.length)],
      ).join("");
      if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) return password;
    }
  }
}
