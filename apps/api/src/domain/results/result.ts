import type { Appointment, AppointmentLine } from "../appointments/appointment.js";
import type { AttachmentType } from "../media/photo.js";
import { ResultNotAllowed } from "./resultErrors.js";

/** A doctor's result for one test: a file (PDF or photo) and an optional comment. */
export interface TestResult {
  id: string;
  appointmentId: string;
  procedureId: string;
  file: { filename: string; mimeType: AttachmentType; sizeBytes: number; storageKey: string };
  comment: string | null;
  uploadedBy: { id: string; name: string };
  uploadedAt: Date;
  /** Null while it is a draft only the doctors see. */
  releasedAt: Date | null;
}

/**
 * What the patient sees: nothing to expect yet, waiting for the doctor, ready but locked until
 * the visit is paid, or ready to open.
 */
export type ResultsState = "none" | "pending" | "locked" | "ready";

export const RESULT_COMMENT_MAX_LENGTH = 1000;

/** The tests whose samples were taken: each needs a result. */
export function testsNeedingResults(appointment: Pick<Appointment, "status" | "lines">) {
  return appointment.status === "collected"
    ? appointment.lines.filter((line) => line.collected === true)
    : [];
}

/** Business rule: results go on collected tests of a collected visit, until they're released. */
export function assertCanUpload(
  appointment: Pick<Appointment, "status" | "lines">,
  procedureId: string,
  results: readonly TestResult[],
): AppointmentLine {
  if (appointment.status !== "collected") {
    throw new ResultNotAllowed("Results can be added once the samples are collected.");
  }
  const line = testsNeedingResults(appointment).find((test) => test.procedureId === procedureId);
  if (!line) throw new ResultNotAllowed("This test's sample wasn't collected.");
  if (results.some((result) => result.releasedAt)) {
    throw new ResultNotAllowed("These results are already released.");
  }
  return line;
}

/** Business rule: release once every collected test has a result, and only once. */
export function assertCanRelease(
  appointment: Pick<Appointment, "status" | "lines">,
  results: readonly TestResult[],
): void {
  if (results.some((result) => result.releasedAt)) {
    throw new ResultNotAllowed("These results are already released.");
  }
  const tests = testsNeedingResults(appointment);
  const missing = tests.filter(
    (test) => !results.some((result) => result.procedureId === test.procedureId),
  );
  if (tests.length === 0 || missing.length > 0) {
    throw new ResultNotAllowed(
      `Add a result for every collected test first (missing: ${missing.map((test) => test.code).join(", ") || "all"}).`,
    );
  }
}

/** Business rule: results are held until the visit is paid (a ₱0 visit counts as paid). */
export function resultsState(
  appointment: Pick<Appointment, "status" | "paymentStatus">,
  results: readonly TestResult[],
): ResultsState {
  if (appointment.status !== "collected") return "none";
  if (!results.some((result) => result.releasedAt)) return "pending";
  return appointment.paymentStatus === "unpaid" ? "locked" : "ready";
}
