import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { StaffDirectory, StaffMember } from "../ports/staffDirectory.js";

export interface ListStaffInput {
  role: BaseRole | null;
}

/** Active staff for pickers, e.g. choosing a team's members. */
export class ListStaff {
  constructor(private readonly staff: StaffDirectory) {}

  async execute({ role }: ListStaffInput): Promise<StaffMember[]> {
    return this.staff.listActive(role);
  }
}
