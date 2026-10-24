import type { ListRoles } from "../../../application/access/ListRoles.js";
import type { Controller, HttpResponse } from "../httpTypes.js";
import { presentRoleList } from "../presenters/rolePresenter.js";

export class ListRolesController implements Controller {
  constructor(private readonly listRoles: ListRoles) {}

  async handle(): Promise<HttpResponse> {
    return presentRoleList(await this.listRoles.execute());
  }
}
