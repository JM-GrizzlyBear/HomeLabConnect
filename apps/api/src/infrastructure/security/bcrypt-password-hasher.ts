import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../../application/ports/password-hasher";

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 10) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
