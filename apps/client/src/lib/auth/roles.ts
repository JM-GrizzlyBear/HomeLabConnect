import type { Role } from "@homelabconnect/shared";

interface RoleInfo {
  path: string;
  label: string;
}

export const ROLE_INFO: Record<Role, RoleInfo> = {
  admin: { path: "/admin", label: "Admin" },
  doctor: { path: "/doctor", label: "Doctor" },
  patient: { path: "/patient", label: "Patient" },
  med_team: { path: "/med-team", label: "Medical Team" },
  support: { path: "/support", label: "Support" },
};

export function roleToPath(role: Role): string {
  return ROLE_INFO[role].path;
}

export function roleLabel(role: Role): string {
  return ROLE_INFO[role].label;
}
