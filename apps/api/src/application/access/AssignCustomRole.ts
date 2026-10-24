import { CustomRoleNotFound } from "../../domain/access/accessErrors.js";
import { assertNotOwnRole, assertRoleFitsUser } from "../../domain/access/customRole.js";
import { UserNotFound } from "../../domain/identity/identityErrors.js";
import type { RoleRepository } from "../../domain/access/RoleRepository.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import { toUserSummaryOutput, type UserSummaryOutput } from "../identity/userSummaryOutput.js";

export interface AssignCustomRoleInput {
  /** The admin making the change. */
  actorId: string;
  userId: string;
  /** null puts the user back on their plain base role. */
  customRoleId: string | null;
}

/** An admin puts a user on a custom role matching their base role. Applies on their next request. */
export class AssignCustomRole {
  constructor(
    private readonly users: UserRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute({
    actorId,
    userId,
    customRoleId,
  }: AssignCustomRoleInput): Promise<UserSummaryOutput> {
    assertNotOwnRole(actorId, userId);
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFound();

    if (customRoleId !== null) {
      const role = await this.roles.findCustomRole(customRoleId);
      if (!role) throw new CustomRoleNotFound();
      assertRoleFitsUser(role, user.role);
    }
    await this.users.setCustomRole(userId, customRoleId);

    const item = await this.users.findListItem(userId);
    if (!item) throw new UserNotFound();
    return toUserSummaryOutput(item);
  }
}
