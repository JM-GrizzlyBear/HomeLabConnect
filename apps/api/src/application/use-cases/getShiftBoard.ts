import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { ScheduleDay } from "../../domain/scheduling/shift.js";
import type { StaffDirectory, StaffMember } from "../ports/staffDirectory.js";
import { buildSchedules, type ScheduleRepositories } from "./buildSchedules.js";

export interface GetShiftBoardInput {
  from: string;
  to: string;
  role: BaseRole | null;
}

export interface ShiftBoardRow {
  person: StaffMember;
  days: ScheduleDay[];
}

/** Every active staff member's days in a range: hours, off, closed or on leave. */
export class GetShiftBoard {
  constructor(
    private readonly repositories: ScheduleRepositories,
    private readonly staff: StaffDirectory,
  ) {}

  async execute({ from, to, role }: GetShiftBoardInput): Promise<ShiftBoardRow[]> {
    const people = await this.staff.listActive(role);
    const schedules = await buildSchedules(
      people.map((person) => person.id),
      from,
      to,
      this.repositories,
    );
    return people.map((person) => ({ person, days: schedules.get(person.id) ?? [] }));
  }
}
