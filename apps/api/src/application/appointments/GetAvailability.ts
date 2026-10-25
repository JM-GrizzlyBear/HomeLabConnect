import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import { type DayAvailability, dayAvailability } from "../../domain/appointments/availability.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";
import type { SettingsRepository } from "../../domain/settings/SettingsRepository.js";
import type { Clock } from "../ports/Clock.js";
import { datesBetween, type ScheduleRepositories } from "../scheduling/buildSchedules.js";
import { teamsOnDuty } from "./teamsOnDuty.js";

export interface GetAvailabilityInput {
  from: string;
  to: string;
}

export interface AvailabilityRepositories extends ScheduleRepositories {
  appointments: AppointmentRepository;
  teams: MedTeamRepository;
  settings: SettingsRepository;
}

/** Each day in the range: bookable or why not, and how many places each time slot has left. */
export class GetAvailability {
  constructor(
    private readonly repositories: AvailabilityRepositories,
    private readonly clock: Clock,
  ) {}

  async execute({ from, to }: GetAvailabilityInput): Promise<DayAvailability[]> {
    const { appointments, teams, settings, ...schedules } = this.repositories;
    const dates = datesBetween(from, to);
    const [{ settings: rules }, closedDays, onDuty, bookings] = await Promise.all([
      settings.get(),
      schedules.closedDays.list(),
      teamsOnDuty(from, to, teams, schedules),
      appointments.bookingsBetween(from, to),
    ]);
    const now = this.clock.now();
    const none = { bySlot: new Map<string, number>(), total: 0 };
    return dates.map((date) =>
      dayAvailability(
        date,
        now,
        rules,
        closedDays,
        onDuty.get(date)?.length ?? 0,
        bookings.get(date) ?? none,
      ),
    );
  }
}
