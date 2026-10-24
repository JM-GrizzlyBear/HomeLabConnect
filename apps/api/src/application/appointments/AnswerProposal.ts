import { assertCan } from "../../domain/appointments/appointment.js";
import { AppointmentStatusConflict } from "../../domain/appointments/appointmentErrors.js";
import { capacityOf } from "../../domain/appointments/availability.js";
import { type AppointmentEmails, notifyPatient } from "../ports/AppointmentEmails.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentOutput, toAppointmentOutput } from "./appointmentOutput.js";
import type { AvailabilityRepositories } from "./GetAvailability.js";
import { findVisible } from "./GetAppointment.js";
import { teamsOnDuty } from "./teamsOnDuty.js";

export interface AnswerProposalInput {
  id: string;
  patientId: string;
  accept: boolean;
}

/**
 * The patient answers a proposed new time: accepting moves the visit there and confirms
 * it (if that slot still has room); declining cancels the appointment.
 */
export class AnswerProposal {
  constructor(
    private readonly repositories: AvailabilityRepositories,
    private readonly emails: AppointmentEmails,
    private readonly clock: Clock,
  ) {}

  async execute({ id, patientId, accept }: AnswerProposalInput): Promise<AppointmentOutput> {
    const { appointments, teams, settings, ...schedules } = this.repositories;
    const viewer = { userId: patientId, canViewAll: false };
    const appointment = await findVisible(appointments, id, viewer);
    assertCan("answer_proposal", appointment.status);
    const proposal = appointment.openProposal;
    if (!proposal) throw new AppointmentStatusConflict("There's no new time to answer.");

    const { settings: rules } = await settings.get();
    if (accept) {
      const onDuty =
        (await teamsOnDuty(proposal.date, proposal.date, teams, schedules)).get(proposal.date) ?? 0;
      await appointments.acceptProposal(id, capacityOf(onDuty, rules), patientId);
    } else {
      await appointments.declineProposal(id, patientId);
    }
    const updated = await findVisible(appointments, id, viewer);
    await notifyPatient(this.emails, accept ? "confirmed" : "cancelled", updated);
    return toAppointmentOutput(updated, rules.cancelCutoffHours, this.clock.now());
  }
}
