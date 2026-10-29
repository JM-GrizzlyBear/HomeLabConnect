import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import { ATTACHMENT_MAX_BYTES, detectAttachmentType } from "../../domain/media/photo.js";
import type { LeaveRepository } from "../../domain/scheduling/LeaveRepository.js";
import type { ShiftRepository } from "../../domain/scheduling/ShiftRepository.js";
import type { StaffDirectory } from "../../domain/scheduling/StaffDirectory.js";
import { InvalidTicket, TicketNotFound } from "../../domain/support/supportErrors.js";
import {
  type MessageAttachment,
  type Ticket,
  type TicketAccess,
  ticketAccess,
  type TicketViewer,
} from "../../domain/support/ticket.js";
import type { TicketRepository } from "../../domain/support/TicketRepository.js";
import type { AppEvent, EventPublisher } from "../ports/EventPublisher.js";
import type { PrivateFileStorage } from "../ports/PrivateFileStorage.js";

export interface SupportRepositories {
  tickets: TicketRepository;
  appointments: AppointmentRepository;
  staff: StaffDirectory;
  shifts: ShiftRepository;
  leave: LeaveRepository;
}

/** The ticket, if the viewer may see it; anyone else gets 404, as if it didn't exist. */
export async function findAccessible(
  tickets: TicketRepository,
  id: string,
  viewer: TicketViewer,
): Promise<{ ticket: Ticket; access: Exclude<TicketAccess, null> }> {
  const ticket = await tickets.findById(id);
  const access = ticket && ticketAccess(ticket, viewer);
  if (!ticket || !access) throw new TicketNotFound();
  return { ticket, access };
}

/** People who can take tickets: active support agents and admins. */
export async function supportStaff(staff: StaffDirectory) {
  const everyone = await staff.listActive(null);
  return everyone.filter((member) => member.role === "support" || member.role === "admin");
}

/**
 * Tells the patient and support staff what changed, so their pages refresh. Support sees the
 * whole queue, so they all hear about every ticket.
 */
export async function announce(
  repositories: SupportRepositories,
  events: EventPublisher,
  ticket: Ticket,
  event: AppEvent,
): Promise<void> {
  const staff = await supportStaff(repositories.staff);
  events.publish([ticket.patient.id, ...staff.map((member) => member.id)], event);
}

/** Checks a chat file (a PDF or photo, by its first bytes) and stores it privately. */
export async function saveAttachment(
  files: PrivateFileStorage,
  file: { data: Uint8Array; filename: string } | null,
): Promise<MessageAttachment | null> {
  if (!file) return null;
  if (file.data.byteLength > ATTACHMENT_MAX_BYTES) {
    throw new InvalidTicket("Files must be 5 MB or smaller.");
  }
  const mimeType = detectAttachmentType(file.data);
  if (!mimeType) throw new InvalidTicket("Attach a PDF, or a JPG, PNG or WebP photo.");
  const { storageKey } = await files.save({ ...file, mimeType });
  return {
    filename: file.filename.slice(0, 200),
    mimeType,
    sizeBytes: file.data.byteLength,
    storageKey,
  };
}
