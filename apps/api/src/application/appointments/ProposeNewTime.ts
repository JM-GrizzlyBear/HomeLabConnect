import { assertCan } from "../../domain/appointments/appointment.js";
import { SlotFull } from "../../domain/appointments/appointmentErrors.js";
import { assertBookableSlot } from "../../domain/appointments/availability.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";
import { type AvailabilityRepositories, GetAvailability } from "./GetAvailability.js";
import { findVisible } from "./GetAppointment.js";

export interface ProposeNewTimeInput {
  id: string;
  actorId: string;
  date: string;
  slot: string;
  reason: string;
}

/**
 * Staff offer the patient another time. The appointment waits for the patient's answer;
 * the new place is only taken when they accept.
 */
export class ProposeNewTime {
  constructor(
    private readonly repositories: AvailabilityRepositories,
    private readonly emails: AppointmentEmails,
    private readonly clock: Clock,
  ) {}

  async execute(input: ProposeNewTimeInput): Promise<AppointmentOutput> {
    const { appointments, settings } = this.repositories;
    const viewer = { userId: input.actorId, canViewAll: true };
    const appointment = await findVisible(appointments, input.id, viewer);
    assertCan("propose", appointment.status);

    const [{ settings: rules }, closedDays] = await Promise.all([
      settings.get(),
      this.repositories.closedDays.list(),
    ]);
    const now = this.clock.now();
    assertBookableSlot(input.date, input.slot, now, rules, closedDays);
    const [day] = await new GetAvailability(this.repositories, this.clock).execute({
      from: input.date,
      to: input.date,
    });
    const slot = day?.slots.find((candidate) => candidate.start === input.slot);
    if (!slot || slot.left === 0) throw new SlotFull();

    await appointments.proposeTime(
      input.id,
      { date: input.date, slot: input.slot, reason: input.reason },
      input.actorId,
    );
    const updated = await findVisible(appointments, input.id, viewer);
    await notifyPatient(this.emails, "new_time_proposed", updated);
    return toAppointmentOutput(updated, rules.cancelCutoffHours, now);
  }
}
