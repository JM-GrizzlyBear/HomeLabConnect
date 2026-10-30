import { randomBytes } from "node:crypto";
import type { SecretTokens } from "../../application/ports/SecretTokens.js";

/** 32 random bytes from a CSPRNG, URL-safe (43 characters). */
export class CryptoSecretTokens implements SecretTokens {
  generate(): string {
    return randomBytes(32).toString("base64url");
  }
}
