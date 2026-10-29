import { PermissionDenied } from "../../domain/access/accessErrors.js";
import { InvalidTicket, TicketNotAllowed } from "../../domain/support/supportErrors.js";
import type { Ticket, TicketPriority, TicketViewer } from "../../domain/support/ticket.js";
import type { Clock } from "../ports/Clock.js";
import type { AppEvent, EventPublisher } from "../ports/EventPublisher.js";
import {
  announce,
  findAccessible,
  type SupportRepositories,
  supportStaff,
} from "./supportRepositories.js";

type Change = Extract<AppEvent, { type: "ticket.updated" }>["change"];

/** What support does to a ticket besides chatting: claim, reassign, prioritise, close, rate. */
abstract class TicketAction {
  constructor(
    protected readonly repositories: SupportRepositories,
    private readonly events: EventPublisher,
    protected readonly clock: Clock,
  ) {}

  /** Tells everyone concerned, with the ticket as it is now. */
  protected async changed(ticketId: string, actorId: string, change: Change): Promise<void> {
    const ticket = await this.repositories.tickets.findById(ticketId);
    if (!ticket) return;
    await announce(this.repositories, this.events, ticket, {
      type: "ticket.updated",
      ticketId,
      subject: ticket.subject,
      actorId,
      change,
      assigneeId: ticket.assignee?.id ?? null,
    });
  }
}

/** An agent takes an unassigned ticket. */
export class ClaimTicket extends TicketAction {
  async execute(id: string, viewer: TicketViewer): Promise<void> {
    const { ticket } = await findAccessible(this.repositories.tickets, id, viewer);
    if (ticket.status === "closed") throw new TicketNotAllowed("This ticket is closed.");
    if (ticket.assignee) {
      if (ticket.assignee.id === viewer.userId) return;
      throw new TicketNotAllowed(`${ticket.assignee.name} already has this ticket.`);
    }
    await this.repositories.tickets.update(
      id,
      { assigneeId: viewer.userId, status: "assigned" },
      this.clock.now(),
    );
    await this.changed(id, viewer.userId, "assigned");
  }
}

/** Hands a ticket to another agent (or admin). */
export class ReassignTicket extends TicketAction {
  async execute(id: string, assigneeId: string, viewer: TicketViewer): Promise<void> {
    const { ticket } = await findAccessible(this.repositories.tickets, id, viewer);
    if (ticket.status === "closed") throw new TicketNotAllowed("This ticket is closed.");
    const staff = await supportStaff(this.repositories.staff);
    if (!staff.some((member) => member.id === assigneeId)) {
      throw new InvalidTicket("Choose an active support agent or admin.");
    }
    if (ticket.assignee?.id === assigneeId) return;
    await this.repositories.tickets.update(
      id,
      {
        assigneeId,
        ...(ticket.status === "open" ? { status: "assigned" as const } : {}),
      },
      this.clock.now(),
    );
    await this.changed(id, viewer.userId, "assigned");
  }
}

export class SetTicketPriority extends TicketAction {
  async execute(id: string, priority: TicketPriority, viewer: TicketViewer): Promise<void> {
    await findAccessible(this.repositories.tickets, id, viewer);
    await this.repositories.tickets.update(id, { priority }, this.clock.now());
    await this.changed(id, viewer.userId, "priority");
  }
}

/** Support (with support.close) or the patient closes a ticket. */
export class CloseTicket extends TicketAction {
  async execute(id: string, viewer: TicketViewer): Promise<void> {
    const { ticket, access } = await findAccessible(this.repositories.tickets, id, viewer);
    if (access === "agent" && !viewer.canClose) throw new PermissionDenied();
    if (ticket.status === "closed") return;
    const now = this.clock.now();
    await this.repositories.tickets.update(
      id,
      { status: "closed", closedAt: now, closedBy: viewer.userId },
      now,
    );
    await this.changed(id, viewer.userId, "closed");
  }
}

/** The patient rates the help, once, after the ticket is closed. */
export class RateTicket extends TicketAction {
  async execute(
    id: string,
    rating: { rating: number; comment: string | null },
    viewer: TicketViewer,
  ): Promise<void> {
    const { ticket, access } = await findAccessible(this.repositories.tickets, id, viewer);
    if (access !== "patient") throw new PermissionDenied();
    assertRateable(ticket);
    await this.repositories.tickets.update(
      id,
      { rating: rating.rating, ratingComment: rating.comment?.trim() || null },
      this.clock.now(),
    );
    await this.changed(id, viewer.userId, "rated");
  }
}

function assertRateable(ticket: Ticket): void {
  if (ticket.status !== "closed") throw new TicketNotAllowed("Rate the help once it's closed.");
  if (ticket.rating !== null) throw new TicketNotAllowed("You've already rated this ticket.");
}
