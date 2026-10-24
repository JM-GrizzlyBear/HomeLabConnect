import { StaffNotFound } from "../../domain/scheduling/schedulingErrors.js";
import { checkHours, checkShiftDates, type ShiftHours } from "../../domain/scheduling/shift.js";
import type { ShiftRepository } from "../ports/shiftRepository.js";
import type { StaffDirectory } from "../ports/staffDirectory.js";

export interface SetShiftDaysInput {
  userId: string;
  dates: string[];
  /** The hours for every chosen date, or null to make them days off. */
  hours: ShiftHours | null;
}

/** An admin picks days on the calendar and gives them all the same hours, or takes them off. */
export class SetShiftDays {
  constructor(
    private readonly shifts: ShiftRepository,
    private readonly staff: StaffDirectory,
  ) {}

  async execute({ userId, dates, hours }: SetShiftDaysInput): Promise<number> {
    const people = await this.staff.listActive(null);
    if (!people.some((person) => person.id === userId)) throw new StaffNotFound();
    const checkedDates = checkShiftDates(dates);
    await this.shifts.setDays(userId, checkedDates, hours ? checkHours(hours) : null);
    return checkedDates.length;
  }
}
