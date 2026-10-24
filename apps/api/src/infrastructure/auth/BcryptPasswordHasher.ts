import bcrypt from "bcrypt";
import type { PasswordHasher } from "../../application/ports/PasswordHasher.js";

export class BcryptPasswordHasher implements PasswordHasher {
  private dummyHash: Promise<string> | undefined;

  constructor(private readonly rounds = 12) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async verify(plain: string, hash: string | null): Promise<boolean> {
    if (hash !== null) return bcrypt.compare(plain, hash);
    // Same cost as a real check, so unknown emails aren't answered faster.
    this.dummyHash ??= bcrypt.hash("no-such-user-password", this.rounds);
    await bcrypt.compare(plain, await this.dummyHash);
    return false;
  }
}
