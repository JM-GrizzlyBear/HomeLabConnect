import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { UserListItem } from "../../domain/identity/UserRepository.js";

/** A row in the admin user list: never the password hash. */
export interface UserSummaryOutput {
  id: string;
  email: string;
  role: BaseRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  customRole: { id: string; name: string } | null;
  isActive: boolean;
  mustChangePassword: boolean;
  temporaryPasswordExpiresAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export function toUserSummaryOutput({
  user,
  customRole,
  lastLoginAt,
  createdAt,
}: UserListItem): UserSummaryOutput {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    customRole,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt,
    lastLoginAt,
    createdAt,
  };
}
