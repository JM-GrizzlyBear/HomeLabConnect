import { PermissionDenied } from "../../domain/access/accessErrors.js";
import { missedTests } from "../../domain/appointments/appointment.js";
import {
  AppointmentStatusConflict,
  SlotNotBookable,
  TeamUnavailable,
} from "../../domain/appointments/appointmentErrors.js";
import { assertBookableSlot, capacityOf } from "../../domain/appointments/availability.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";
import { assignIfAutomatic } from "./assignIfAutomatic.js";
import { type AppointmentViewer, findViewable } from "./GetAppointment.js";
import type { AvailabilityRepositories } from "./GetAvailability.js";
import { teamsOnDutyOn } from "./teamsOnDuty.js";

export interface ScheduleReturnVisitInput {
  id: string;
  /** canAssign: staff with appointments.assign; the visit's own team may too. */
  actor: AppointmentViewer & { canAssign: boolean };
  date: string;
  slot: string;
}

/**
 * Books a return visit for the tests that weren't collected: a new, confirmed appointment
 * at ₱0 (the tests were priced on the first booking), linked to the original, and given to
 * the same team when it's free.
 */
export class ScheduleReturnVisit {
  constructor(
    private readonly repositories: AvailabilityRepositories,
    private readonly emails: AppointmentEmails,
    private readonly clock: Clock,
  ) {}

  async execute({ id, actor, date, slot }: ScheduleReturnVisitInput): Promise<AppointmentOutput> {
    const { appointments, teams, settings, ...schedules } = this.repositories;
    const { appointment, access } = await findViewable(this.repositories, id, actor);
    if (access === "patient" || (access === "staff" && !actor.canAssign)) {
      throw new PermissionDenied();
    }
    const missed = missedTests(appointment);
    if (missed.length === 0) {
      throw new AppointmentStatusConflict("Every test on this visit was collected.");
    }

    const [{ settings: rules }, closedDays] = await Promise.all([
      settings.get(),
      schedules.closedDays.list(),
    ]);
    const now = this.clock.now();
    assertBookableSlot(date, slot, now, rules, closedDays);
    const onDuty = await teamsOnDutyOn(date, teams, schedules);
    if (onDuty.length === 0) throw new SlotNotBookable("No team is available that day.");

    const booked = await appointments.book(
      {
        patientId: appointment.patientId,
        date,
        slot,
        status: "confirmed",
        address: appointment.address,
        landmark: appointment.landmark,
        notes: appointment.notes,
        lines: missed.map((line) => ({
          ...line,
          priceCentavos: 0,
          discountCentavos: 0,
          promotionId: null,
          promotionName: "Return visit",
          collected: null,
        })),
        returnOfId: appointment.id,
      },
      capacityOf(onDuty.length, rules),
      actor.userId,
    );
    await appointments.addEvent(
      booked.id,
      actor.userId,
      "return_scheduled",
      `Return of ${appointment.code}`,
    );
    await appointments.addEvent(
      appointment.id,
      actor.userId,
      "return_scheduled",
      `Return visit ${booked.code}`,
    );

    // The same team, if it's on duty and free then; otherwise as Settings says
    const sameTeam = appointment.team && onDuty.some((team) => team.id === appointment.team?.id);
    let assigned = false;
    if (sameTeam && appointment.team) {
      try {
        await appointments.assignTeam(
          booked.id,
          appointment.team.id,
          rules.visitsPerTeamPerDay,
          actor.userId,
        );
        assigned = true;
      } catch (error) {
        if (!(error instanceof TeamUnavailable)) throw error;
      }
    }
    if (!assigned) await assignIfAutomatic(booked.id, this.repositories);

    const created = (await appointments.findById(booked.id)) ?? booked;
    await notifyPatient(this.emails, "confirmed", created);
    return toAppointmentOutput(created, rules.cancelCutoffHours, now);
  }
}
