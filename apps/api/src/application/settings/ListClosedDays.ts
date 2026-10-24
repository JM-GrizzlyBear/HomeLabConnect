import type { ClosedDay } from "../../domain/settings/closedDay.js";
import type { ClosedDayRepository } from "../../domain/settings/ClosedDayRepository.js";

export interface ListClosedDaysInput {
  /** One-time closed days in this year, plus every yearly one. null: all of them. */
  year: number | null;
}

export class ListClosedDays {
  constructor(private readonly closedDays: ClosedDayRepository) {}

  async execute({ year }: ListClosedDaysInput): Promise<ClosedDay[]> {
    const all = await this.closedDays.list();
    if (year === null) return all;
    return all.filter((day) => day.repeatsYearly || day.date.startsWith(`${year}-`));
  }
}
