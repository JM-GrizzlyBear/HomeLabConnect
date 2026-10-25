import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type {
  AppointmentNoteRepository,
  NewAttachment,
  NewNote,
} from "../../domain/appointments/AppointmentNoteRepository.js";
import type { AppointmentNote, NoteAttachment } from "../../domain/appointments/note.js";
import type { Database } from "./client.js";
import { appointmentAttachments, appointmentNotes, users } from "./schema/index.js";

const fullName = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;

/** What callers see of a file: not which note it's on, nor its storage key. */
function toAttachment(
  file: NoteAttachment & { noteId: string; storageKey: string },
): NoteAttachment {
  return {
    id: file.id,
    filename: file.filename,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    url: file.url,
    uploadedBy: file.uploadedBy,
    createdAt: file.createdAt,
  };
}

export class DrizzleAppointmentNoteRepository implements AppointmentNoteRepository {
  constructor(private readonly db: Database) {}

  async list(appointmentId: string, sharedOnly: boolean): Promise<AppointmentNote[]> {
    const notes = await this.db
      .select({
        id: appointmentNotes.id,
        appointmentId: appointmentNotes.appointmentId,
        authorId: appointmentNotes.authorId,
        authorName: fullName,
        body: appointmentNotes.body,
        sharedWithPatient: appointmentNotes.sharedWithPatient,
        createdAt: appointmentNotes.createdAt,
      })
      .from(appointmentNotes)
      .innerJoin(users, eq(users.id, appointmentNotes.authorId))
      .where(
        and(
          eq(appointmentNotes.appointmentId, appointmentId),
          sharedOnly ? eq(appointmentNotes.sharedWithPatient, true) : undefined,
        ),
      )
      .orderBy(desc(appointmentNotes.createdAt));
    if (notes.length === 0) return [];

    const files = await this.attachmentsOf(notes.map((note) => note.id));
    return notes.map(({ authorId, authorName, ...note }) => ({
      ...note,
      author: { id: authorId, name: authorName },
      attachments: files.filter((file) => file.noteId === note.id).map(toAttachment),
    }));
  }

  async create(note: NewNote): Promise<string> {
    const [row] = await this.db
      .insert(appointmentNotes)
      .values(note)
      .returning({ id: appointmentNotes.id });
    if (!row) throw new Error("Insert into appointment_notes returned no row.");
    return row.id;
  }

  async addAttachment(attachment: NewAttachment): Promise<void> {
    await this.db.insert(appointmentAttachments).values(attachment);
  }

  async findAttachment(
    appointmentId: string,
    attachmentId: string,
  ): Promise<(NoteAttachment & { storageKey: string }) | null> {
    const [file] = await this.attachmentsOf(
      null,
      and(
        eq(appointmentAttachments.id, attachmentId),
        eq(appointmentAttachments.appointmentId, appointmentId),
      ),
    );
    return file ? { ...toAttachment(file), storageKey: file.storageKey } : null;
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.db.delete(appointmentAttachments).where(eq(appointmentAttachments.id, attachmentId));
  }

  private async attachmentsOf(noteIds: string[] | null, where?: ReturnType<typeof and>) {
    const rows = await this.db
      .select({
        id: appointmentAttachments.id,
        noteId: appointmentAttachments.noteId,
        filename: appointmentAttachments.filename,
        mimeType: appointmentAttachments.mimeType,
        sizeBytes: appointmentAttachments.sizeBytes,
        url: appointmentAttachments.url,
        storageKey: appointmentAttachments.storageKey,
        uploadedById: appointmentAttachments.uploadedBy,
        uploadedByName: fullName,
        createdAt: appointmentAttachments.createdAt,
      })
      .from(appointmentAttachments)
      .innerJoin(users, eq(users.id, appointmentAttachments.uploadedBy))
      .where(noteIds ? inArray(appointmentAttachments.noteId, noteIds) : where);
    return rows.map(({ uploadedById, uploadedByName, ...row }) => ({
      ...row,
      uploadedBy: { id: uploadedById, name: uploadedByName },
    }));
  }
}
