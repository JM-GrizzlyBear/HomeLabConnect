import { UserNotFound } from "../../domain/identity/identityErrors.js";
import { assertProfileFitsRole, type ProfileChanges } from "../../domain/identity/profile.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import { toProfileOutput, type ProfileOutput } from "./profileOutput.js";

export interface UpdateProfileInput extends ProfileChanges {
  userId: string;
}

/** A user edits their own name, phone and (patients only) birth date and address. */
export class UpdateProfile {
  constructor(private readonly users: UserRepository) {}

  async execute({ userId, ...changes }: UpdateProfileInput): Promise<ProfileOutput> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFound();
    assertProfileFitsRole(user.role, changes);

    await this.users.updateProfile(userId, changes);

    const profile = await this.users.findProfile(userId);
    if (!profile) throw new UserNotFound();
    return toProfileOutput(profile);
  }
}
