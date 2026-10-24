import {
  assertNoClash,
  checkClosedDay,
  type ClosedDay,
  type ClosedDayDetails,
} from "../../domain/settings/closedDay.js";
import type { ClosedDayRepository } from "../../domain/settings/ClosedDayRepository.js";

export interface AddClosedDayInput extends ClosedDayDetails {
  actorId: string;
}

/** An admin closes a date (a holiday or a special day off) so nobody can book it. */
export class AddClosedDay {
  constructor(private readonly closedDays: ClosedDayRepository) {}

  async execute({ actorId, ...input }: AddClosedDayInput): Promise<ClosedDay> {
    const details = checkClosedDay(input);
    assertNoClash(details, await this.closedDays.list(), null);
    return this.closedDays.create(details, actorId);
  }
}
