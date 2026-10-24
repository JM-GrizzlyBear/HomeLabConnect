import { listStaffQuerySchema } from "@homelabconnect/shared";
import type { ListStaff } from "../../../application/scheduling/ListStaff.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentStaffList } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListStaffController implements Controller {
  constructor(private readonly listStaff: ListStaff) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { role } = parseRequest(listStaffQuerySchema, request.query);
    return presentStaffList(await this.listStaff.execute({ role: role ?? null }));
  }
}
