import type { Appointment } from "../../domain/appointments/appointment.js";
import { visitNotice } from "../../domain/notifications/notification.js";
import type { AppointmentEmails, AppointmentNotice } from "../ports/AppointmentEmails.js";
import type { Notifier } from "./Notifier.js";

/**
 * Every email a patient gets about their visit also goes in their bell. Wraps the real mailer,
 * so each use case that emails the patient notifies them in-app too, without knowing.
 */
export class NotifyingAppointmentEmails implements AppointmentEmails {
  constructor(
    private readonly emails: AppointmentEmails,
    private readonly notifier: Notifier,
  ) {}

  async send(notice: AppointmentNotice, appointment: Appointment): Promise<void> {
    try {
      await this.emails.send(notice, appointment);
    } finally {
      const link =
        notice === "results_ready" ? "/app/results/mine" : `/app/appointments/${appointment.id}`;
      await this.notifier.toUsers([appointment.patientId], visitNotice(notice, appointment, link));
    }
  }
}
