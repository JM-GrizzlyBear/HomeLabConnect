import type { Appointment } from "../../domain/appointments/appointment.js";

/** What happened to an appointment, from the patient's point of view. */
export type AppointmentNotice =
  | "received"
  | "confirmed"
  | "rejected"
  | "new_time_proposed"
  | "cancelled"
  | "payment_received"
  | "payment_refunded";

/** Port: tells the patient by email when their appointment changes. */
export interface AppointmentEmails {
  send(notice: AppointmentNotice, appointment: Appointment): Promise<void>;
}

/** Emails are a courtesy: a failed send never undoes the change itself. */
export async function notifyPatient(
  emails: AppointmentEmails,
  notice: AppointmentNotice,
  appointment: Appointment,
): Promise<void> {
  try {
    await emails.send(notice, appointment);
  } catch {
    // The appointment page shows the same information.
  }
}
