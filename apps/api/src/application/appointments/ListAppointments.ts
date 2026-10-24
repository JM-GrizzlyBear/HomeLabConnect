import type { AppointmentStatus } from "../../domain/appointments/appointment.js";
import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import type { SettingsRepository } from "../../domain/settings/SettingsRepository.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";

export interface ListAppointmentsInput {
  status: AppointmentStatus | null;
  from: string | null;
  to: string | null;
  q: string | null;
  page: number;
  pageSize: number;
}

export interface ListAppointmentsOutput {
  items: AppointmentOutput[];
  total: number;
  page: number;
  pageSize: number;
}

/** Staff: every appointment, filtered and paged; pending ones first, then by visit time. */
export class ListAppointments {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly settings: SettingsRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListAppointmentsInput): Promise<ListAppointmentsOutput> {
    const [page, { settings }] = await Promise.all([
      this.appointments.list({ ...input, q: input.q?.trim() || null }),
      this.settings.get(),
    ]);
    const now = this.clock.now();
    return {
      items: page.items.map((item) => toAppointmentOutput(item, settings.cancelCutoffHours, now)),
      total: page.total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }
}
