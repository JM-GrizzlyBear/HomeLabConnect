import { UserNotFound } from "../../domain/identity/identityErrors.js";
import type { UserRepository } from "../ports/userRepository.js";
import type { ResolvePermissions } from "./resolvePermissions.js";
import { type SessionUserOutput, toUserOutput } from "./userOutput.js";

export interface GetCurrentUserInput {
  userId: string;
}

export class GetCurrentUser {
  constructor(
    private readonly users: UserRepository,
    private readonly permissions: ResolvePermissions,
  ) {}

  async execute(input: GetCurrentUserInput): Promise<SessionUserOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFound();
    return { ...toUserOutput(user), permissions: await this.permissions.execute(user) };
  }
}
