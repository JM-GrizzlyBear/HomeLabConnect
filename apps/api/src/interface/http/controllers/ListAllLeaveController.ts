import { listLeaveQuerySchema } from "@homelabconnect/shared";
import type { ListAllLeave } from "../../../application/scheduling/ListAllLeave.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentLeaveList } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListAllLeaveController implements Controller {
  constructor(private readonly listAllLeave: ListAllLeave) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { status } = parseRequest(listLeaveQuerySchema, request.query);
    return presentLeaveList(await this.listAllLeave.execute({ status: status ?? null }));
  }
}
