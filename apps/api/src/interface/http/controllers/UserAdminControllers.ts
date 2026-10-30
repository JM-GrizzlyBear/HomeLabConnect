import {
  listUsersQuerySchema,
  setUserOverridesRequestSchema,
  updateUserRequestSchema,
  userIdParamsSchema,
} from "@homelabconnect/shared";
import type {
  GetUserPermissions,
  SetUserOverrides,
  UserPermissionsOutput,
} from "../../../application/access/UserPermissions.js";
import type { ListUsers } from "../../../application/identity/ListUsers.js";
import type { UpdateUser } from "../../../application/identity/UpdateUser.js";
import type { Clock } from "../../../application/ports/Clock.js";
import { businessDate } from "../../../domain/time/businessDate.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { csvFile } from "../presenters/csv.js";
import { presentUserSummary } from "../presenters/userAdminPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** Up to this many users in one export (far more than the clinic has). */
const EXPORT_LIMIT = 10_000;

export class UpdateUserController implements Controller {
  constructor(private readonly updateUser: UpdateUser) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(userIdParamsSchema, request.params);
    const body = parseRequest(updateUserRequestSchema, request.body);
    return presentUserSummary(await this.updateUser.execute({ userId: id, ...body }));
  }
}

/** The user list as a CSV, with the same filters as the screen. */
export class ExportUsersController implements Controller {
  constructor(
    private readonly listUsers: ListUsers,
    private readonly clock: Clock,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const query = parseRequest(listUsersQuerySchema, request.query);
    const { items } = await this.listUsers.execute({
      search: query.q ?? null,
      role: query.role ?? null,
      isActive: query.status === undefined ? null : query.status === "active",
      page: 1,
      pageSize: EXPORT_LIMIT,
    });
    const iso = (date: Date | null) => date?.toISOString() ?? "";
    const rows = [
      [
        "First name",
        "Last name",
        "Email",
        "Phone",
        "Role",
        "Custom role",
        "Status",
        "Last sign-in",
        "Created",
      ],
      ...items.map((user) => [
        user.firstName,
        user.lastName,
        user.email,
        user.phone ?? "",
        user.role,
        user.customRole?.name ?? "",
        user.isActive ? "Active" : "Inactive",
        iso(user.lastLoginAt),
        iso(user.createdAt),
      ]),
    ];
    return csvFile(rows, `users-${businessDate(this.clock.now())}.csv`);
  }
}

const presentPermissions = (output: UserPermissionsOutput): HttpResponse => ({
  status: 200,
  body: output,
});

export class GetUserPermissionsController implements Controller {
  constructor(private readonly getUserPermissions: GetUserPermissions) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(userIdParamsSchema, request.params);
    return presentPermissions(await this.getUserPermissions.execute(id));
  }
}

export class SetUserOverridesController implements Controller {
  constructor(private readonly setUserOverrides: SetUserOverrides) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(userIdParamsSchema, request.params);
    const { overrides } = parseRequest(setUserOverridesRequestSchema, request.body);
    const output = await this.setUserOverrides.execute({
      userId: id,
      actorId: requireAuth(request).userId,
      overrides,
    });
    return presentPermissions(output);
  }
}
