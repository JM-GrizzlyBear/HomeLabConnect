import { InvalidNote } from "./appointmentErrors.js";

export interface NoteAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedBy: { id: string; name: string };
  createdAt: Date;
}

/** A note on an appointment, with any files attached to it. */
export interface AppointmentNote {
  id: string;
  appointmentId: string;
  author: { id: string; name: string };
  body: string;
  /** Patients only see notes shared with them. */
  sharedWithPatient: boolean;
  attachments: NoteAttachment[];
  createdAt: Date;
}

export const NOTE_MAX_LENGTH = 2000;

/** Business rule: a note says something (or carries a file), and not too much. */
export function checkNoteBody(body: string, hasFile: boolean): string {
  const trimmed = body.trim();
  if (trimmed.length === 0 && !hasFile) throw new InvalidNote("Write a note or attach a file.");
  if (trimmed.length > NOTE_MAX_LENGTH) {
    throw new InvalidNote(`Keep notes under ${NOTE_MAX_LENGTH} characters.`);
  }
  return trimmed;
}
