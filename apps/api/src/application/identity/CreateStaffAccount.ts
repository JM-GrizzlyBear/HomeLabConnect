import { CustomRoleNotFound } from "../../domain/access/accessErrors.js";
import { assertRoleFitsUser } from "../../domain/access/customRole.js";
import { isStaffRole } from "../../domain/identity/baseRole.js";
import { Email } from "../../domain/identity/email.js";
import { EmailAlreadyTaken, NotAStaffRole } from "../../domain/identity/identityErrors.js";
import { assertPasswordIsStrong } from "../../domain/identity/passwordPolicy.js";
import { temporaryPasswordExpiry } from "../../domain/identity/temporaryPassword.js";
import type { AccountEmails } from "../ports/AccountEmails.js";
import type { Clock } from "../ports/Clock.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { RoleRepository } from "../../domain/access/RoleRepository.js";
import type { TemporaryPasswordGenerator } from "../ports/TemporaryPasswordGenerator.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import {
  deliverTemporaryPassword,
  type TemporaryPasswordOutput,
} from "./temporaryPasswordOutput.js";

export interface CreateStaffAccountInput {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  hiredOn: string | null;
  /** Optional custom role, which must be built on the same base role. */
  customRoleId: string | null;
}

/**
 * An admin creates a staff account. The new user gets an emailed temporary
 * password that works for 7 days and must be changed on first sign-in.
 */
export class CreateStaffAccount {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly passwords: TemporaryPasswordGenerator,
    private readonly emails: AccountEmails,
    private readonly clock: Clock,
    private readonly roles: RoleRepository,
  ) {}

  async execute(input: CreateStaffAccountInput): Promise<TemporaryPasswordOutput> {
    const email = Email.of(input.email);
    if (!isStaffRole(input.role)) throw new NotAStaffRole();
    if (await this.users.findByEmail(email.value)) throw new EmailAlreadyTaken();
    if (input.customRoleId !== null) {
      const role = await this.roles.findCustomRole(input.customRoleId);
      if (!role) throw new CustomRoleNotFound();
      assertRoleFitsUser(role, input.role);
    }

    const temporaryPassword = this.passwords.generate();
    assertPasswordIsStrong(temporaryPassword);
    const expiresAt = temporaryPasswordExpiry(this.clock.now());

    const user = await this.users.createStaffAccount({
      email: email.value,
      passwordHash: await this.hasher.hash(temporaryPassword),
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      hiredOn: input.hiredOn,
      temporaryPasswordExpiresAt: expiresAt,
      customRoleId: input.customRoleId,
    });

    return deliverTemporaryPassword(user, temporaryPassword, expiresAt, () =>
      this.emails.sendStaffWelcome({
        to: user.email,
        firstName: user.firstName,
        temporaryPassword,
        expiresAt,
      }),
    );
  }
}
