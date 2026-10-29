import type { ReportKind, ReportPeriod, ReportPreset } from "./report.js";

/** A report someone saved to open again: its kind, range (or relative preset) and grouping. */
export interface SavedReport {
  id: string;
  userId: string;
  name: string;
  kind: ReportKind;
  period: ReportPeriod;
  /** Set for a relative range ("This month"); then from/to are null. */
  preset: ReportPreset | null;
  from: string | null;
  to: string | null;
  createdAt: Date;
}

export type NewSavedReport = Omit<SavedReport, "id" | "createdAt">;

/** Port: each user's own saved reports. */
export interface SavedReportRepository {
  /** The user's reports, by name. */
  list(userId: string): Promise<SavedReport[]>;
  /** Throws SavedReportNameTaken if the user already has one with that name. */
  create(report: NewSavedReport): Promise<SavedReport>;
  /** False when there's no such report of this user's. */
  delete(id: string, userId: string): Promise<boolean>;
}
