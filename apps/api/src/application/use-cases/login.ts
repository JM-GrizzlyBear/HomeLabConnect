import { Email } from "../../domain/identity/email.js";
import { InvalidCredentials } from "../../domain/identity/identityErrors.js";
import type { Clock } from "../ports/clock.js";
import type { PasswordHasher } from "../ports/passwordHasher.js";
import type { SessionRepository } from "../ports/sessionRepository.js";
import type { TokenService } from "../ports/tokenService.js";
import type { UserRepository } from "../ports/userRepository.js";
import type { ResolvePermissions } from "./resolvePermissions.js";
import { type SessionUserOutput, toUserOutput } from "./userOutput.js";

export interface LoginInput {
  email: string;
  password: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface LoginOutput {
  token: string;
  expiresAt: Date;
  user: SessionUserOutput;
}

export interface LoginOptions {
  sessionTtlMinutes: number;
}

/** Checks credentials, opens a session and issues a token tied to it. */
export class Login {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly clock: Clock,
    private readonly permissions: ResolvePermissions,
    private readonly options: LoginOptions,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.findUser(input.email);
    const passwordMatches = await this.hasher.verify(input.password, user?.passwordHash ?? null);
    if (!user || !passwordMatches) throw new InvalidCredentials();
    user.assertCanSignIn();
    // Checked only after the password matched, so it doesn't reveal which accounts exist.
    const now = this.clock.now();
    user.assertTemporaryPasswordValid(now);

    const expiresAt = new Date(now.getTime() + this.options.sessionTtlMinutes * 60_000);
    const session = await this.sessions.create({
      userId: user.id,
      expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    await this.users.recordSignIn(user.id, now);

    return {
      token: this.tokens.issue({ userId: user.id, sessionId: session.id }, expiresAt),
      expiresAt,
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
