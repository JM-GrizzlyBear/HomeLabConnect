import type { AuthResult, RegisterInput } from "@homelabconnect/shared";
import { ConflictError, ForbiddenError } from "../../domain/error";
import { toPublicUser } from "../../domain/entities/user";
import type { PasswordHasher } from "../ports/password-hasher";
import type { TokenService } from "../ports/token-service";
import type { UserRepository } from "../ports/user-repository";

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async exec(input: RegisterInput): Promise<AuthResult> {
    // Self-registration is patient-only. Other roles must be created by an admin.
    if (input.role !== "patient") {
      throw new ForbiddenError("Only patients can self-register");
    }

    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await this.hasher.hash(input.password);

    const user = await this.users.create({
      email: input.email,
      passwordHash,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName ?? null,
      phone: input.phone ?? null,
      avatar: input.avatar ?? null,
    });

    const token = this.tokens.sign({ sub: user.id, role: user.role });
    return { user: toPublicUser(user), token };
  }
}
