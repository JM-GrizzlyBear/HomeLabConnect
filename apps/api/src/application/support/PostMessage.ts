import { PermissionDenied } from "../../domain/access/accessErrors.js";
import { InvalidTicket } from "../../domain/support/supportErrors.js";
import {
  statusAfterMessage,
  type TicketMessage,
  type TicketViewer,
} from "../../domain/support/ticket.js";
import type { Clock } from "../ports/Clock.js";
import type { EventPublisher } from "../ports/EventPublisher.js";
import type { PrivateFileStorage } from "../ports/PrivateFileStorage.js";
import {
  announce,
  findAccessible,
  saveAttachment,
  type SupportRepositories,
} from "./supportRepositories.js";

export interface PostMessageInput {
  ticketId: string;
  viewer: TicketViewer;
  message: string;
  file: { data: Uint8Array; filename: string } | null;
}

/**
 * Someone writes in a ticket's chat. An agent's reply waits on the patient (and takes an
 * unassigned ticket); the patient's message hands it back to support, reopening it if it was
 * closed less than a week ago.
 */
export class PostMessage {
  constructor(
    private readonly repositories: SupportRepositories,
    private readonly files: PrivateFileStorage,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(input: PostMessageInput): Promise<TicketMessage> {
    const { tickets } = this.repositories;
    const { ticket, access } = await findAccessible(tickets, input.ticketId, input.viewer);
    if (access === "agent" && !input.viewer.canHandle) throw new PermissionDenied();
    const now = this.clock.now();
    const status = statusAfterMessage(ticket, access, now);
    const body = input.message.trim();
    if (!body && !input.file) throw new InvalidTicket("Write a message or attach a file.");

    const attachment = await saveAttachment(this.files, input.file);
    if (access === "agent" && !ticket.assignee) {
      await tickets.update(ticket.id, { assigneeId: input.viewer.userId }, now);
    }
    if (ticket.status === "closed") {
      await tickets.update(ticket.id, { closedAt: null, closedBy: null }, now);
    }
    const message = await tickets.addMessage(
      ticket.id,
      { authorId: input.viewer.userId, body, attachment, at: now },
      status,
    );
    await announce(this.repositories, this.events, ticket, {
      type: "ticket.message",
      ticketId: ticket.id,
      subject: ticket.subject,
      actorId: input.viewer.userId,
      actorName: message.author.name,
    });
    return message;
  }
}
