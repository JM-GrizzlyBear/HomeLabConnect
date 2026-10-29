import { AppointmentNotFound } from "../../domain/appointments/appointmentErrors.js";
import { assertCanRelease } from "../../domain/results/result.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import type { Clock } from "../ports/Clock.js";
import type { ResultRepositories } from "./resultRepositories.js";

/**
 * A doctor releases a visit's results once every collected test has one. The patient is told
 * by email; until the visit is paid, the email says the results open once it is.
 */
export class ReleaseResults {
  constructor(
    private readonly repositories: ResultRepositories,
    private readonly emails: AppointmentEmails,
    private readonly clock: Clock,
  ) {}

  async execute(appointmentId: string, actorId: string): Promise<void> {
    const { appointments, results } = this.repositories;
    const appointment = await appointments.findById(appointmentId);
    if (!appointment) throw new AppointmentNotFound();
    assertCanRelease(appointment, await results.listForAppointment(appointmentId));

    await results.release(appointmentId, actorId, this.clock.now());
    await notifyPatient(
      this.emails,
      appointment.paymentStatus === "unpaid" ? "results_ready_unpaid" : "results_ready",
      appointment,
    );
  }
}
