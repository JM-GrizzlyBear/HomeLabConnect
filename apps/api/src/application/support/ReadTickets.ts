import type { Appointment } from "../../domain/appointments/appointment.js";
import { fullName } from "../../domain/scheduling/StaffDirectory.js";
import { MessageNotFound } from "../../domain/support/supportErrors.js";
import {
  canReopen,
  type Person,
  type Ticket,
  type TicketMessage,
  type TicketSummary,
  type TicketViewer,
} from "../../domain/support/ticket.js";
import type { TicketQueueFilter, TicketRepository } from "../../domain/support/TicketRepository.js";
import type { Clock } from "../ports/Clock.js";
import type { FileDelivery, PrivateFileStorage } from "../ports/PrivateFileStorage.js";
import { findAccessible, type SupportRepositories, supportStaff } from "./supportRepositories.js";

/** The patient's own tickets. */
export class ListMyTickets {
  constructor(private readonly tickets: TicketRepository) {}

  async execute(patientId: string): Promise<TicketSummary[]> {
    return await this.tickets.listForPatient(patientId, patientId);
  }
}

/** The support queue: mine, unassigned or all, filtered. */
export class ListTicketQueue {
  constructor(private readonly tickets: TicketRepository) {}

  async execute(filter: TicketQueueFilter, viewerId: string): Promise<TicketSummary[]> {
    return await this.tickets.listQueue(filter, viewerId);
  }
}

export interface TicketDetailOutput extends Ticket {
  unread: number;
  canReopen: boolean;
  messages: TicketMessage[];
  /** Support only: the linked visit and the patient's other tickets. */
  context: {
    appointment: {
      id: string;
      code: string;
      date: string;
      slot: string;
      status: Appointment["status"];
      totalCentavos: number;
      paymentStatus: Appointment["paymentStatus"];
    } | null;
    otherTickets: TicketSummary[];
  } | null;
}

/** One ticket and its chat. Opening it marks everything in it as read. */
export class GetTicket {
  constructor(
    private readonly repositories: SupportRepositories,
    private readonly clock: Clock,
  ) {}

  async execute(id: string, viewer: TicketViewer): Promise<TicketDetailOutput> {
    const { tickets, appointments } = this.repositories;
    const { ticket, access } = await findAccessible(tickets, id, viewer);
    const messages = await tickets.messages(id);
    await tickets.markRead(id, viewer.userId);

    let context: TicketDetailOutput["context"] = null;
    if (access === "agent") {
      const [appointment, patientTickets] = await Promise.all([
        ticket.appointment ? appointments.findById(ticket.appointment.id) : null,
        tickets.listForPatient(ticket.patient.id, viewer.userId),
      ]);
      context = {
        appointment: appointment && {
          id: appointment.id,
          code: appointment.code,
          date: appointment.date,
          slot: appointment.slot,
          status: appointment.status,
          totalCentavos: appointment.totalCentavos,
          paymentStatus: appointment.paymentStatus,
        },
        otherTickets: patientTickets.filter((other) => other.id !== ticket.id),
      };
    }
    return {
      ...ticket,
      unread: 0,
      canReopen: access === "patient" && canReopen(ticket, this.clock.now()),
      messages,
      context,
    };
  }
}

/** A chat file, for anyone who may see its ticket. */
export class OpenMessageAttachment {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly files: PrivateFileStorage,
  ) {}

  async execute(messageId: string, viewer: TicketViewer): Promise<FileDelivery> {
    const message = await this.tickets.findMessage(messageId);
    if (!message?.attachment) throw new MessageNotFound();
    await findAccessible(this.tickets, message.ticketId, viewer);
    const { storageKey, mimeType, filename } = message.attachment;
    return await this.files.open(storageKey, { mimeType, filename });
  }
}

/** Who a ticket can be handed to. */
export class ListSupportAgents {
  constructor(private readonly repositories: SupportRepositories) {}

  async execute(): Promise<Person[]> {
    const staff = await supportStaff(this.repositories.staff);
    return staff.map((member) => ({ id: member.id, name: fullName(member) }));
  }
}
