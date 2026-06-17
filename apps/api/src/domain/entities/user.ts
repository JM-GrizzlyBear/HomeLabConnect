import type { PublicUser, Role } from "@homelabconnect/shared";

// Pure domain entity — no framework, no DB. The "row" version with
// passwordHash lives in infrastructure; this is what flows through use cases.
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    firstName: u.firstName,
    lastName: u.lastName,
    middleName: u.middleName,
    phone: u.phone,
    avatar: u.avatar,
    isActive: u.isActive,
    emailVerified: u.emailVerified,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}
