import { scheduleRangeQuerySchema } from "@homelabconnect/shared";
import type { GetShiftBoard } from "../../../application/use-cases/getShiftBoard.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentShiftBoard } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class GetShiftBoardController implements Controller {
  constructor(private readonly getShiftBoard: GetShiftBoard) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { from, to, role } = parseRequest(scheduleRangeQuerySchema, request.query);
    return presentShiftBoard(await this.getShiftBoard.execute({ from, to, role: role ?? null }));
  }
}
