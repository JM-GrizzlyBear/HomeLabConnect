import {
  type AppointmentResults,
  appointmentResultsSchema,
  type MyResult,
  myResultsSchema,
  type ReviewQueue,
  reviewQueueSchema,
  type ReviewQueueTab,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchAppointmentResults(
  appointmentId: string,
  signal?: AbortSignal,
): Promise<AppointmentResults> {
  return appointmentResultsSchema.parse(
    await apiRequest(`/appointments/${appointmentId}/results`, { signal }),
  );
}

/** Adds (or replaces) the draft result of one test: a PDF or photo, and a comment. */
export async function uploadTestResult(
  appointmentId: string,
  procedureId: string,
  result: { file: File; comment: string },
): Promise<void> {
  const form = new FormData();
  form.append("file", result.file);
  if (result.comment.trim()) form.append("comment", result.comment.trim());
  await apiRequest(`/appointments/${appointmentId}/results/${procedureId}`, {
    method: "POST",
    body: form,
  });
}

export async function deleteTestResult(appointmentId: string, procedureId: string): Promise<void> {
  await apiRequest(`/appointments/${appointmentId}/results/${procedureId}`, { method: "DELETE" });
}

export async function releaseResults(appointmentId: string): Promise<void> {
  await apiRequest(`/appointments/${appointmentId}/results/release`, { method: "POST" });
}

export async function fetchReviewQueue(
  filters: { tab: ReviewQueueTab; q?: string; page: number; pageSize: number },
  signal?: AbortSignal,
): Promise<ReviewQueue> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return reviewQueueSchema.parse(await apiRequest(`/results/queue?${params}`, { signal }));
}

export async function fetchMyResults(signal?: AbortSignal): Promise<MyResult[]> {
  return myResultsSchema.parse(await apiRequest("/results/mine", { signal }));
}
