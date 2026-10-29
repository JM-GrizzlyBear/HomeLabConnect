import { AppointmentNotFound } from "../../domain/appointments/appointmentErrors.js";
import { ATTACHMENT_MAX_BYTES, detectAttachmentType } from "../../domain/media/photo.js";
import { assertCanUpload, RESULT_COMMENT_MAX_LENGTH } from "../../domain/results/result.js";
import { InvalidResult } from "../../domain/results/resultErrors.js";
import type { PrivateFileStorage } from "../ports/PrivateFileStorage.js";
import type { ResultRepositories } from "./resultRepositories.js";

export interface UploadTestResultInput {
  appointmentId: string;
  procedureId: string;
  file: { data: Uint8Array; filename: string } | null;
  comment: string | null;
  actorId: string;
}

/**
 * A doctor adds the result of one collected test (a PDF or photo, and a comment), as a draft
 * until the results are released. A second upload replaces the first and removes its file.
 */
export class UploadTestResult {
  constructor(
    private readonly repositories: ResultRepositories,
    private readonly files: PrivateFileStorage,
  ) {}

  async execute(input: UploadTestResultInput): Promise<void> {
    const { appointments, results } = this.repositories;
    const appointment = await appointments.findById(input.appointmentId);
    if (!appointment) throw new AppointmentNotFound();
    assertCanUpload(
      appointment,
      input.procedureId,
      await results.listForAppointment(input.appointmentId),
    );

    if (!input.file) throw new InvalidResult("Attach the result as a PDF or photo.");
    if (input.file.data.byteLength > ATTACHMENT_MAX_BYTES) {
      throw new InvalidResult("Files must be 5 MB or smaller.");
    }
    // Trust the file's first bytes, not its name or the type the browser claims
    const mimeType = detectAttachmentType(input.file.data);
    if (!mimeType) throw new InvalidResult("Attach a PDF, or a JPG, PNG or WebP photo.");
    const comment = input.comment?.trim() || null;
    if (comment && comment.length > RESULT_COMMENT_MAX_LENGTH) {
      throw new InvalidResult(`Keep the comment under ${RESULT_COMMENT_MAX_LENGTH} characters.`);
    }

    const { storageKey } = await this.files.save({ ...input.file, mimeType });
    const { replacedStorageKey } = await results.saveDraft({
      appointmentId: input.appointmentId,
      procedureId: input.procedureId,
      file: {
        filename: input.file.filename.slice(0, 200),
        mimeType,
        sizeBytes: input.file.data.byteLength,
        storageKey,
      },
      comment,
      uploadedBy: input.actorId,
    });
    if (replacedStorageKey) await this.removeQuietly(replacedStorageKey);
  }

  /** A leftover file is harmless (it can't be opened without its row), so this never fails. */
  private async removeQuietly(storageKey: string): Promise<void> {
    try {
      await this.files.delete(storageKey);
    } catch {
      // Left behind in storage; nothing links to it any more
    }
  }
}
