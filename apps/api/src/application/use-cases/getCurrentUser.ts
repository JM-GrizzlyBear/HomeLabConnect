import { UserNotFound } from "../../domain/identity/identityErrors.js";
import type { UserRepository } from "../ports/userRepository.js";
import { toUserOutput, type UserOutput } from "./userOutput.js";

export interface GetCurrentUserInput {
  userId: string;
}

export class GetCurrentUser {
  constructor(private readonly users: UserRepository) {}

  async execute(input: GetCurrentUserInput): Promise<UserOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFound();
    return toUserOutput(user);
  }
}
