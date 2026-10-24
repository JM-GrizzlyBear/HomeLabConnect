import { UserNotFound } from "../../domain/identity/identityErrors.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import { toProfileOutput, type ProfileOutput } from "./profileOutput.js";

export interface GetProfileInput {
  userId: string;
}

export class GetProfile {
  constructor(private readonly users: UserRepository) {}

  async execute(input: GetProfileInput): Promise<ProfileOutput> {
    const profile = await this.users.findProfile(input.userId);
    if (!profile) throw new UserNotFound();
    return toProfileOutput(profile);
  }
}
