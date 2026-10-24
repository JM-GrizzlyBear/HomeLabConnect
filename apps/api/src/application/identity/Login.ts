import { Email } from "../../domain/identity/email.js";
import { InvalidCredentials } from "../../domain/identity/identityErrors.js";
import type { Clock } from "../ports/Clock.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import type { ResolvePermissions } from "../access/ResolvePermissions.js";
import { type SessionUserOutput, toUserOutput } from "./userOutput.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: SessionUserOutput;
}

/** Checks credentials. The caller then starts a session for `user.id`. */
export class Login {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
    private readonly permissions: ResolvePermissions,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.findUser(input.email);
    const passwordMatches = await this.hasher.verify(input.password, user?.passwordHash ?? null);
    if (!user || !passwordMatches) throw new InvalidCredentials();
    user.assertCanSignIn();
    // Checked only after the password matched, so it doesn't reveal which accounts exist.
    const now = this.clock.now();
    user.assertTemporaryPasswordValid(now);

    await this.users.recordSignIn(user.id, now);
    return {
      user: { ...toUserOutput(user), permissions: await this.permissions.execute(user) },
    };
  }

  private async findUser(rawEmail: string) {
    try {
      return await this.users.findByEmail(Email.of(rawEmail).value);
    } catch {
      return null;
    }
  }
}
