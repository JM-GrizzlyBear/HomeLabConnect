import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import type { SettingsRepository } from "../../domain/settings/SettingsRepository.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";

export interface ListMyAppointmentsInput {
  patientId: string;
}

/** A patient's own appointments, newest visit first. */
export class ListMyAppointments {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly settings: SettingsRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ patientId }: ListMyAppointmentsInput): Promise<AppointmentOutput[]> {
    const [list, { settings }] = await Promise.all([
      this.appointments.listForPatient(patientId),
      this.settings.get(),
    ]);
    const now = this.clock.now();
    return list.map((appointment) =>
      toAppointmentOutput(appointment, settings.cancelCutoffHours, now),
    );
  }
}
