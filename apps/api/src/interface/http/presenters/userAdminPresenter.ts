import type { TemporaryPasswordResponse, UserList, UserSummary } from "@homelabconnect/shared";
import type { ListUsersOutput } from "../../../application/identity/ListUsers.js";
import type { TemporaryPasswordOutput } from "../../../application/identity/temporaryPasswordOutput.js";
import type { UserSummaryOutput } from "../../../application/identity/userSummaryOutput.js";
import type { HttpResponse } from "../httpTypes.js";
import { presentUser } from "./authPresenter.js";

function toUserSummary(output: UserSummaryOutput): UserSummary {
  return {
    id: output.id,
    email: output.email,
    role: output.role,
    firstName: output.firstName,
    lastName: output.lastName,
    phone: output.phone,
    customRole: output.customRole,
    isActive: output.isActive,
    mustChangePassword: output.mustChangePassword,
    temporaryPasswordExpiresAt: output.temporaryPasswordExpiresAt?.toISOString() ?? null,
    lastLoginAt: output.lastLoginAt?.toISOString() ?? null,
    createdAt: output.createdAt.toISOString(),
  };
}

export function presentUserSummary(output: UserSummaryOutput): HttpResponse<UserSummary> {
  return { status: 200, body: toUserSummary(output) };
}

export function presentUserList(output: ListUsersOutput): HttpResponse<UserList> {
  return {
    status: 200,
    body: {
      items: output.items.map(toUserSummary),
      total: output.total,
      page: output.page,
      pageSize: output.pageSize,
    },
  };
}

export function presentTemporaryPassword(
  output: TemporaryPasswordOutput,
  status = 200,
): HttpResponse<TemporaryPasswordResponse> {
  return {
    status,
    body: {
      user: presentUser(output.user).body,
      temporaryPasswordExpiresAt: output.temporaryPasswordExpiresAt.toISOString(),
      emailSent: output.emailSent,
      ...(output.temporaryPassword === null ? {} : { temporaryPassword: output.temporaryPassword }),
    },
  };
}
