import { PermissionDenied } from "../../domain/access/accessErrors.js";
import { InvalidNote } from "../../domain/appointments/appointmentErrors.js";
import type { AppointmentNoteRepository } from "../../domain/appointments/AppointmentNoteRepository.js";
import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import { type AppointmentNote, checkNoteBody } from "../../domain/appointments/note.js";
import { ATTACHMENT_MAX_BYTES, detectAttachmentType } from "../../domain/media/photo.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";
import type { FileStorage } from "../ports/FileStorage.js";
import { type AppointmentViewer, findViewable } from "./GetAppointment.js";

export interface NoteRepositories {
  appointments: AppointmentRepository;
  teams: MedTeamRepository;
  notes: AppointmentNoteRepository;
}

/** Who is asking about notes, and what they may do with them. */
export interface NoteViewer extends AppointmentViewer {
  /** notes.view: staff and the med team see every note. */
  canViewNotes: boolean;
  /** notes.attach: may add a file to a note. */
  canAttach?: boolean;
  /** Admins may remove anyone's file. */
  isAdmin?: boolean;
}

/** The notes on an appointment: everything for staff and its team, the shared ones for its patient. */
export class ListAppointmentNotes {
  constructor(private readonly repositories: NoteRepositories) {}

  async execute({ id, viewer }: { id: string; viewer: NoteViewer }): Promise<AppointmentNote[]> {
    const { access } = await findViewable(this.repositories, id, viewer);
    if (access === "patient") return await this.repositories.notes.list(id, true);
    if (!viewer.canViewNotes) throw new PermissionDenied();
    return await this.repositories.notes.list(id, false);
  }
}

export interface AddAppointmentNoteInput {
  id: string;
  viewer: NoteViewer;
  body: string;
  sharedWithPatient: boolean;
  file: { data: Uint8Array; filename: string } | null;
}

/** Staff or the visit's med team add a note, optionally with a photo or PDF. */
export class AddAppointmentNote {
  constructor(
    private readonly repositories: NoteRepositories,
    private readonly files: FileStorage,
  ) {}

  async execute(input: AddAppointmentNoteInput): Promise<AppointmentNote[]> {
    const { access } = await findViewable(this.repositories, input.id, input.viewer);
    if (access === "patient") throw new PermissionDenied();
    const body = checkNoteBody(input.body, input.file !== null);

    let upload = null;
    if (input.file) {
      if (!input.viewer.canAttach) throw new PermissionDenied();
      if (input.file.data.byteLength > ATTACHMENT_MAX_BYTES) {
        throw new InvalidNote("Files must be 5 MB or smaller.");
      }
      // Trust the file's first bytes, not its name or the type the browser claims
      const mimeType = detectAttachmentType(input.file.data);
      if (!mimeType) throw new InvalidNote("Attach a JPG, PNG, WebP photo or a PDF.");
      upload = { ...input.file, mimeType };
    }

    const noteId = await this.repositories.notes.create({
      appointmentId: input.id,
      authorId: input.viewer.userId,
      body,
      sharedWithPatient: input.sharedWithPatient,
    });
    if (upload) {
      const stored = await this.files.save(upload);
      await this.repositories.notes.addAttachment({
        noteId,
        appointmentId: input.id,
        uploadedBy: input.viewer.userId,
        filename: upload.filename.slice(0, 200),
        mimeType: upload.mimeType,
        sizeBytes: upload.data.byteLength,
        url: stored.url,
        storageKey: stored.storageKey,
      });
    }
    return await this.repositories.notes.list(input.id, false);
  }
}

/** Removes a file: by whoever uploaded it, or an admin. */
export class DeleteAttachment {
  constructor(
    private readonly repositories: NoteRepositories,
    private readonly files: FileStorage,
  ) {}

  async execute({
    id,
    attachmentId,
    viewer,
  }: {
    id: string;
    attachmentId: string;
    viewer: NoteViewer;
  }): Promise<void> {
    const { access } = await findViewable(this.repositories, id, viewer);
    if (access === "patient") throw new PermissionDenied();
    const file = await this.repositories.notes.findAttachment(id, attachmentId);
    if (!file) throw new InvalidNote("That file is already gone.");
    if (file.uploadedBy.id !== viewer.userId && !viewer.isAdmin) throw new PermissionDenied();
    await this.repositories.notes.deleteAttachment(attachmentId);
    await this.files.delete(file.storageKey);
  }
}
