import { listUsersQuerySchema } from "@homelabconnect/shared";
import type { ListUsers } from "../../../application/use-cases/listUsers.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentUserList } from "../presenters/userAdminPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListUsersController implements Controller {
  constructor(private readonly listUsers: ListUsers) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const query = parseRequest(listUsersQuerySchema, request.query);
    const output = await this.listUsers.execute({
      search: query.q ?? null,
      role: query.role ?? null,
      isActive: query.status === undefined ? null : query.status === "active",
      page: query.page,
      pageSize: query.pageSize,
    });
    return presentUserList(output);
  }
}
