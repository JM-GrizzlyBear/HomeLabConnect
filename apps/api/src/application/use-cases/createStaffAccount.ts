import { isStaffRole } from "../../domain/identity/baseRole.js";
import { Email } from "../../domain/identity/email.js";
import { EmailAlreadyTaken, NotAStaffRole } from "../../domain/identity/identityErrors.js";
import { assertPasswordIsStrong } from "../../domain/identity/passwordPolicy.js";
import { temporaryPasswordExpiry } from "../../domain/identity/temporaryPassword.js";
import type { AccountEmails } from "../ports/accountEmails.js";
import type { Clock } from "../ports/clock.js";
import type { PasswordHasher } from "../ports/passwordHasher.js";
import type { TemporaryPasswordGenerator } from "../ports/temporaryPasswordGenerator.js";
import type { UserRepository } from "../ports/userRepository.js";
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
  ) {}

  async execute(input: CreateStaffAccountInput): Promise<TemporaryPasswordOutput> {
    const email = Email.of(input.email);
    if (!isStaffRole(input.role)) throw new NotAStaffRole();
    if (await this.users.findByEmail(email.value)) throw new EmailAlreadyTaken();

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
