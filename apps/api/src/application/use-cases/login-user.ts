import type { AuthResult, LoginInput } from "@homelabconnect/shared";
import { toPublicUser } from "../../domain/entities/user";
import { ForbiddenError, UnauthorizedError } from "../../domain/error";
import type { PasswordHasher } from "../ports/password-hasher";
import type { TokenService } from "../ports/token-service";
import type { UserRepository } from "../ports/user-repository";

export class LoginUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async exec(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);
    if (!user) throw new UnauthorizedError("Invalid email or password");

    const ok = await this.hasher.verify(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Invalid email or password");

    if (!user.isActive) throw new ForbiddenError("Account is disabled");

    await this.users.touchLastLogin(user.id);
    const token = this.tokens.sign({ sub: user.id, role: user.role });
    return { user: toPublicUser(user), token };
  }
}
