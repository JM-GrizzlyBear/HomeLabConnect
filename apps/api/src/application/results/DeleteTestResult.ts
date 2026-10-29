import { ResultNotFound } from "../../domain/results/resultErrors.js";
import type { PrivateFileStorage } from "../ports/PrivateFileStorage.js";
import type { ResultRepositories } from "./resultRepositories.js";

/** A doctor removes a draft result (released results stay). */
export class DeleteTestResult {
  constructor(
    private readonly repositories: ResultRepositories,
    private readonly files: PrivateFileStorage,
  ) {}

  async execute(appointmentId: string, procedureId: string): Promise<void> {
    const storageKey = await this.repositories.results.deleteDraft(appointmentId, procedureId);
    if (!storageKey) throw new ResultNotFound();
    try {
      await this.files.delete(storageKey);
    } catch {
      // Left behind in storage; nothing links to it any more
    }
  }
}
