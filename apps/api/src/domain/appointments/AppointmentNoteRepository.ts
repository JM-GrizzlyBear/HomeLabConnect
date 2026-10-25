import type { AppointmentNote, NoteAttachment } from "./note.js";

export interface NewNote {
  appointmentId: string;
  authorId: string;
  body: string;
  sharedWithPatient: boolean;
}

export interface NewAttachment {
  noteId: string;
  appointmentId: string;
  uploadedBy: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  storageKey: string;
}

/** Port: notes and files on appointments. */
export interface AppointmentNoteRepository {
  /** Newest first; `sharedOnly` for the patient. */
  list(appointmentId: string, sharedOnly: boolean): Promise<AppointmentNote[]>;
  create(note: NewNote): Promise<string>;
  addAttachment(attachment: NewAttachment): Promise<void>;
  findAttachment(
    appointmentId: string,
    attachmentId: string,
  ): Promise<(NoteAttachment & { storageKey: string }) | null>;
  deleteAttachment(attachmentId: string): Promise<void>;
}
