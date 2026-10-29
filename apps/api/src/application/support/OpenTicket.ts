import { AppointmentNotFound } from "../../domain/appointments/appointmentErrors.js";
import { businessDate } from "../../domain/time/businessDate.js";
import {
  isOnShift,
  pickAgent,
  type Ticket,
  type TicketCategory,
} from "../../domain/support/ticket.js";
import type { Clock } from "../ports/Clock.js";
import type { EventPublisher } from "../ports/EventPublisher.js";
import type { PrivateFileStorage } from "../ports/PrivateFileStorage.js";
import { announce, saveAttachment, type SupportRepositories } from "./supportRepositories.js";

export interface OpenTicketInput {
  patientId: string;
  subject: string;
  category: TicketCategory;
  appointmentId: string | null;
  message: string;
  file: { data: Uint8Array; filename: string } | null;
}

/**
 * A patient asks for help. The ticket goes straight to the least busy support agent on shift
 * right now; with nobody on shift it waits, unassigned, in the queue.
 */
export class OpenTicket {
  constructor(
    private readonly repositories: SupportRepositories,
    private readonly files: PrivateFileStorage,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(input: OpenTicketInput): Promise<Ticket> {
    if (input.appointmentId) {
      const appointment = await this.repositories.appointments.findById(input.appointmentId);
      if (appointment?.patientId !== input.patientId) throw new AppointmentNotFound();
    }
    const now = this.clock.now();
    const attachment = await saveAttachment(this.files, input.file);
    const ticket = await this.repositories.tickets.create(
      {
        patientId: input.patientId,
        subject: input.subject.trim(),
        category: input.category,
        appointmentId: input.appointmentId,
        assigneeId: await this.agentOnShift(now),
        at: now,
      },
      { body: input.message.trim(), attachment },
    );
    await announce(this.repositories, this.events, ticket, {
      type: "ticket.updated",
      ticketId: ticket.id,
      subject: ticket.subject,
      actorId: input.patientId,
      change: ticket.assignee ? "assigned" : "opened",
      assigneeId: ticket.assignee?.id ?? null,
    });
    return ticket;
  }

  private async agentOnShift(now: Date): Promise<string | null> {
    const { staff, shifts, leave, tickets } = this.repositories;
    const agents = await staff.listActive("support");
    if (agents.length === 0) return null;
    const ids = agents.map((agent) => agent.id);
    const today = businessDate(now);
    const [shiftDays, leaveDays] = await Promise.all([
      shifts.shiftsFor(ids, today, today),
      leave.approvedDays(ids, today, today),
    ]);
    const onShift = ids.filter((id) =>
      isOnShift(now, { shifts: shiftDays.get(id) ?? [], leave: leaveDays.get(id) ?? [] }),
    );
    return pickAgent(await tickets.workload(onShift));
  }
}
