import { CANCELLABLE_STATUSES, type Appointment } from "../../domain/appointments/appointment.js";
import { businessDateTime } from "../../domain/time/businessDate.js";

export interface AppointmentOutput extends Appointment {
  /** Until when the patient may still cancel it themselves; null once they can't. */
  cancellableUntil: Date | null;
}

/** Adds what the patient may still do, given the cancellation cut-off. */
export function toAppointmentOutput(
  appointment: Appointment,
  cancelCutoffHours: number,
  now: Date,
): AppointmentOutput {
  const until = new Date(
    businessDateTime(appointment.date, appointment.slot).getTime() -
      cancelCutoffHours * 60 * 60_000,
  );
  const open = CANCELLABLE_STATUSES.includes(appointment.status) && until.getTime() > now.getTime();
  return { ...appointment, cancellableUntil: open ? until : null };
}
