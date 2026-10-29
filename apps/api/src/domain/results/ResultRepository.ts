import type { PaymentStatus } from "../appointments/appointment.js";
import type { TestResult } from "./result.js";

export type ReviewQueueTab = "to_upload" | "ready_to_release" | "released";

export interface ReviewQueueItem {
  appointmentId: string;
  code: string;
  patientName: string;
  date: string;
  slot: string;
  paymentStatus: PaymentStatus;
  testsCollected: number;
  testsWithResults: number;
  releasedAt: Date | null;
}

/** Port: the doctors' results for each appointment's tests. */
export interface ResultRepository {
  listForAppointment(appointmentId: string): Promise<TestResult[]>;
  findById(id: string): Promise<TestResult | null>;
  /**
   * Saves a draft result for a test, replacing the one it had. Returns the replaced file's
   * storage key, so the old file can be removed.
   */
  saveDraft(input: {
    appointmentId: string;
    procedureId: string;
    file: TestResult["file"];
    comment: string | null;
    uploadedBy: string;
  }): Promise<{ replacedStorageKey: string | null }>;
  /** Removes a draft; returns its storage key, or null if there was none (or it's released). */
  deleteDraft(appointmentId: string, procedureId: string): Promise<string | null>;
  /** Releases every result of the appointment and adds the history event, together. */
  release(appointmentId: string, actorId: string, at: Date): Promise<void>;
  /** Collected visits for the doctors, newest visit first. */
  queue(query: {
    tab: ReviewQueueTab;
    q: string | null;
    page: number;
    pageSize: number;
  }): Promise<{ items: ReviewQueueItem[]; total: number }>;
  /** The patient's collected visits whose results are released. */
  releasedForPatient(patientId: string): Promise<ReviewQueueItem[]>;
}
