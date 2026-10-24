import {
  assertNoClash,
  checkClosedDay,
  type ClosedDay,
  type ClosedDayDetails,
} from "../../domain/settings/closedDay.js";
import { ClosedDayNotFound } from "../../domain/settings/settingsErrors.js";
import type { ClosedDayRepository } from "../ports/closedDayRepository.js";

export interface UpdateClosedDayInput extends ClosedDayDetails {
  id: string;
}

export class UpdateClosedDay {
  constructor(private readonly closedDays: ClosedDayRepository) {}

  async execute({ id, ...input }: UpdateClosedDayInput): Promise<ClosedDay> {
    if (!(await this.closedDays.findById(id))) throw new ClosedDayNotFound();
    const details = checkClosedDay(input);
    assertNoClash(details, await this.closedDays.list(), id);
    await this.closedDays.update(id, details);
    return { id, ...details };
  }
}
