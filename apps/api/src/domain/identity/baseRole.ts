/**
 * The built-in roles every user has. Custom roles (Module 2) are layered on
 * top of one of these.
 */
export const BASE_ROLES = ["patient", "med_team", "doctor", "support", "admin"] as const;

export type BaseRole = (typeof BASE_ROLES)[number];

export function isBaseRole(value: string): value is BaseRole {
  return (BASE_ROLES as readonly string[]).includes(value);
}

/** Roles an admin gives to staff accounts. Patients only come from self-registration. */
export const STAFF_ROLES = [
  "med_team",
  "doctor",
  "support",
  "admin",
] as const satisfies readonly BaseRole[];

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}
