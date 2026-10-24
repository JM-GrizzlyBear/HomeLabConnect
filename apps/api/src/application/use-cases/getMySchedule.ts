import type { ScheduleDay } from "../../domain/scheduling/shift.js";
import { buildSchedules, type ScheduleRepositories } from "./buildSchedules.js";

export interface GetMyScheduleInput {
  userId: string;
  from: string;
  to: string;
}

/** A staff member's own days: hours, days off, closed days and leave. */
export class GetMySchedule {
  constructor(private readonly repositories: ScheduleRepositories) {}

  async execute({ userId, from, to }: GetMyScheduleInput): Promise<ScheduleDay[]> {
    const schedules = await buildSchedules([userId], from, to, this.repositories);
    return schedules.get(userId) ?? [];
  }
}
