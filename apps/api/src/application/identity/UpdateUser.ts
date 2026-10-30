import { EmailAlreadyTaken, UserNotFound } from "../../domain/identity/identityErrors.js";
import { assertProfileFitsRole } from "../../domain/identity/profile.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import { toUserSummaryOutput, type UserSummaryOutput } from "./userSummaryOutput.js";

export interface UpdateUserInput {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

/** An admin corrects someone's name, email or phone. Patients must keep a phone number. */
export class UpdateUser {
  constructor(private readonly users: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<UserSummaryOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFound();
    const email = input.email.trim().toLowerCase();
    const changes = {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim() || null,
    };
    assertProfileFitsRole(user.role, { ...changes, patient: null });
    const owner = await this.users.findByEmail(email);
    if (owner && owner.id !== user.id) throw new EmailAlreadyTaken();

    await this.users.updateAccount(user.id, { ...changes, email });
    const item = await this.users.findListItem(user.id);
    if (!item) throw new UserNotFound();
    return toUserSummaryOutput(item);
  }
}
