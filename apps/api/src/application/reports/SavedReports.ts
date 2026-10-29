import { assertRange } from "../../domain/reports/report.js";
import { InvalidReportRange, SavedReportNotFound } from "../../domain/reports/reportErrors.js";
import type {
  NewSavedReport,
  SavedReport,
  SavedReportRepository,
} from "../../domain/reports/SavedReportRepository.js";

/** The user's own saved reports, by name. */
export class ListSavedReports {
  constructor(private readonly reports: SavedReportRepository) {}

  async execute(userId: string): Promise<SavedReport[]> {
    return await this.reports.list(userId);
  }
}

/** Saves a report to open again: either a relative preset or a fixed range. */
export class SaveReport {
  constructor(private readonly reports: SavedReportRepository) {}

  async execute(input: NewSavedReport): Promise<SavedReport> {
    if (input.preset) {
      return await this.reports.create({ ...input, name: input.name.trim(), from: null, to: null });
    }
    if (!input.from || !input.to) {
      throw new InvalidReportRange("Pick a date range, or a preset like This month.");
    }
    assertRange({ from: input.from, to: input.to });
    return await this.reports.create({ ...input, name: input.name.trim() });
  }
}

/** Deletes one of the user's own saved reports (anyone else's answers 404). */
export class DeleteSavedReport {
  constructor(private readonly reports: SavedReportRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    if (!(await this.reports.delete(id, userId))) throw new SavedReportNotFound();
  }
}
