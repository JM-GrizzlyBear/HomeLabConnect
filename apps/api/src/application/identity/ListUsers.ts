import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import { toUserSummaryOutput, type UserSummaryOutput } from "./userSummaryOutput.js";

export interface ListUsersInput {
  search: string | null;
  role: BaseRole | null;
  isActive: boolean | null;
  page: number;
  pageSize: number;
}

export interface ListUsersOutput {
  items: UserSummaryOutput[];
  total: number;
  page: number;
  pageSize: number;
}

/** An admin browses every account, newest first, with optional filters. */
export class ListUsers {
  constructor(private readonly users: UserRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    const search = input.search?.trim() || null;
    const { items, total } = await this.users.list({ ...input, search });
    return {
      items: items.map(toUserSummaryOutput),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }
}
