import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { User } from "../../domain/identity/user.js";

/** What use cases return about a user: never the password hash. */
export interface UserOutput {
  id: string;
  email: string;
  role: BaseRole;
  firstName: string;
  lastName: string;
  mustChangePassword: boolean;
}

export function toUserOutput(user: User): UserOutput {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    mustChangePassword: user.mustChangePassword,
  };
}
