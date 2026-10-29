import { resultsState } from "../../domain/results/result.js";
import { ResultNotFound } from "../../domain/results/resultErrors.js";
import { findViewable } from "../appointments/GetAppointment.js";
import type { FileDelivery, PrivateFileStorage } from "../ports/PrivateFileStorage.js";
import type { ResultRepositories, ResultViewer } from "./resultRepositories.js";

/**
 * Hands out one result file after checking who's asking: doctors any time, the patient once the
 * results are released and paid. Everyone else gets 404, as if it didn't exist.
 */
export class OpenResultFile {
  constructor(
    private readonly repositories: ResultRepositories,
    private readonly files: PrivateFileStorage,
  ) {}

  async execute(resultId: string, viewer: ResultViewer): Promise<FileDelivery> {
    const result = await this.repositories.results.findById(resultId);
    if (!result) throw new ResultNotFound();
    const { appointment, access } = await findViewable(
      this.repositories,
      result.appointmentId,
      viewer,
    );
    const allowed =
      (access !== "patient" && viewer.canReview) ||
      (access === "patient" &&
        resultsState(
          appointment,
          await this.repositories.results.listForAppointment(appointment.id),
        ) === "ready");
    if (!allowed) throw new ResultNotFound();
    return await this.files.open(result.file.storageKey, {
      mimeType: result.file.mimeType,
      filename: result.file.filename,
    });
  }
}
