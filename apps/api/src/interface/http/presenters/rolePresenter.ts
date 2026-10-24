import type { CustomRole, PermissionKey, RoleList } from "@homelabconnect/shared";
import type { CustomRoleRecord } from "../../../domain/access/RoleRepository.js";
import type { RoleListOutput } from "../../../application/access/ListRoles.js";
import type { HttpResponse } from "../httpTypes.js";

function toCustomRole(role: CustomRoleRecord): CustomRole {
  return {
    id: role.id,
    name: role.name,
    baseRole: role.baseRole,
    description: role.description,
    userCount: role.userCount,
    entries: role.entries.map((entry) => ({
      key: entry.key as PermissionKey,
      effect: entry.effect,
    })),
  };
}

export function presentCustomRole(role: CustomRoleRecord, status = 200): HttpResponse<CustomRole> {
  return { status, body: toCustomRole(role) };
}

export function presentRoleList(output: RoleListOutput): HttpResponse<RoleList> {
  return {
    status: 200,
    body: {
      baseRoles: output.baseRoles.map((role) => ({
        id: role.id,
        name: role.name,
        grants: role.grants as PermissionKey[],
        userCount: role.userCount,
      })),
      customRoles: output.customRoles.map(toCustomRole),
    },
  };
}
