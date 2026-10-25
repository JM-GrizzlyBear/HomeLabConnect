import { type Appointment, assertCan } from "../../domain/appointments/appointment.js";
import {
  AppointmentNotFound,
  InvalidVisitRecord,
} from "../../domain/appointments/appointmentErrors.js";
import type { AvailabilityRepositories } from "./GetAvailability.js";
import { myTeamIds } from "./ListMyVisits.js";

export type RecordVisitInput =
  | { id: string; userId: string; outcome: "on_the_way" }
  | {
      id: string;
      userId: string;
      outcome: "collected";
      collectedProcedureIds: readonly string[];
      note: string | null;
    }
  | { id: string; userId: string; outcome: "not_collected"; reason: string };

/**
 * A member of the visit's med team records it: on the way, then collected (which tests) or
 * couldn't collect (why). Visits of other teams answer 404.
 */
export class RecordVisit {
  constructor(private readonly repositories: AvailabilityRepositories) {}

  async execute(input: RecordVisitInput): Promise<Appointment> {
    const { appointments } = this.repositories;
    const appointment = await appointments.findById(input.id);
    if (!appointment?.team) throw new AppointmentNotFound();
    const teamIds = await myTeamIds(this.repositories, input.userId, appointment.date);
    if (!teamIds.includes(appointment.team.id)) throw new AppointmentNotFound();

    if (input.outcome === "on_the_way") {
      assertCan("start_visit", appointment.status);
      await appointments.recordVisit(input.id, {
        status: "on_the_way",
        actorId: input.userId,
        note: null,
      });
    } else if (input.outcome === "collected") {
      assertCan("record_visit", appointment.status);
      const booked = new Set(appointment.lines.map((line) => line.procedureId));
      if (input.collectedProcedureIds.length === 0) {
        throw new InvalidVisitRecord("Tick at least one test, or record it as not collected.");
      }
      if (input.collectedProcedureIds.some((id) => !booked.has(id))) {
        throw new InvalidVisitRecord("Only tests on this visit can be ticked.");
      }
      await appointments.recordVisit(input.id, {
        status: "collected",
        actorId: input.userId,
        collectedProcedureIds: input.collectedProcedureIds,
        note: input.note,
      });
    } else {
      assertCan("record_visit", appointment.status);
      await appointments.recordVisit(input.id, {
        status: "not_collected",
        actorId: input.userId,
        note: input.reason,
      });
    }
    const updated = await appointments.findById(input.id);
    if (!updated) throw new AppointmentNotFound();
    return updated;
  }
}
