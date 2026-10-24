import type { BaseRole } from "../../domain/identity/baseRole.js";

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: BaseRole;
}

/** Port: active staff, for pickers and scheduling rules. Patients are never included. */
export interface StaffDirectory {
  /** Active staff, by last then first name; only `role` when given. */
  listActive(role: BaseRole | null): Promise<StaffMember[]>;
}

export const fullName = (person: Pick<StaffMember, "firstName" | "lastName">) =>
  `${person.firstName} ${person.lastName}`;
