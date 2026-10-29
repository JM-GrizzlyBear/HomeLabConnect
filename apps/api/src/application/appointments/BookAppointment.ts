import { SlotNotBookable } from "../../domain/appointments/appointmentErrors.js";
import { assertBookableSlot, capacityOf } from "../../domain/appointments/availability.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import { visitNotice } from "../../domain/notifications/notification.js";
import type { Notifier } from "../notifications/Notifier.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";
import type { AvailabilityRepositories } from "./GetAvailability.js";
import type { QuoteBooking } from "./QuoteBooking.js";
import { assignIfAutomatic } from "./assignIfAutomatic.js";
import { teamsOnDutyOn } from "./teamsOnDuty.js";

export interface BookAppointmentInput {
  patientId: string;
  procedureIds: readonly string[];
  date: string;
  slot: string;
  address: string;
  landmark: string | null;
  notes: string | null;
}

/**
 * A patient books a home visit. Prices are copied onto the booking, so later price or
 * promotion changes don't affect it. With automatic approval it's confirmed at once.
 */
export class BookAppointment {
  constructor(
    private readonly repositories: AvailabilityRepositories,
    private readonly quote: QuoteBooking,
    private readonly emails: AppointmentEmails,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
  ) {}

  async execute(input: BookAppointmentInput): Promise<AppointmentOutput> {
    const { appointments, teams, settings, ...schedules } = this.repositories;
    const [{ settings: rules }, closedDays] = await Promise.all([
      settings.get(),
      schedules.closedDays.list(),
    ]);
    assertBookableSlot(input.date, input.slot, this.clock.now(), rules, closedDays);

    const onDuty = (await teamsOnDutyOn(input.date, teams, schedules)).length;
    if (onDuty === 0) throw new SlotNotBookable("No team is available that day.");

    const { lines } = await this.quote.execute({ procedureIds: input.procedureIds });
    const booked = await appointments.book(
      {
        patientId: input.patientId,
        date: input.date,
        slot: input.slot,
        status: rules.bookingApproval === "automatic" ? "confirmed" : "pending",
        address: input.address,
        landmark: input.landmark,
        notes: input.notes,
        lines,
      },
      capacityOf(onDuty, rules),
      input.patientId,
    );
    await notifyPatient(
      this.emails,
      booked.status === "confirmed" ? "confirmed" : "received",
      booked,
    );
    if (booked.status === "pending") {
      await this.notifier.toRoles(["support", "admin"], visitNotice("booking_pending", booked));
    }
    const assigned = await assignIfAutomatic(booked.id, this.repositories, this.notifier);
    return toAppointmentOutput(assigned ?? booked, rules.cancelCutoffHours, this.clock.now());
  }
}
