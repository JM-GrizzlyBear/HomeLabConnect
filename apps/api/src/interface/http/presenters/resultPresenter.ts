import type {
  AppointmentResults,
  MyResult,
  ReviewQueue,
  ReviewQueueItem as ReviewQueueItemView,
  TestResultView,
} from "@homelabconnect/shared";
import type { AppointmentResultsOutput } from "../../../application/results/GetAppointmentResults.js";
import type { ReviewQueueOutput } from "../../../application/results/ListReviewQueue.js";
import type { FileDelivery } from "../../../application/ports/PrivateFileStorage.js";
import type { TestResult } from "../../../domain/results/result.js";
import type { ReviewQueueItem } from "../../../domain/results/ResultRepository.js";
import type { HttpResponse } from "../httpTypes.js";

function toResultView(result: TestResult): TestResultView {
  return {
    id: result.id,
    filename: result.file.filename,
    mimeType: result.file.mimeType,
    sizeBytes: result.file.sizeBytes,
    comment: result.comment,
    uploadedBy: result.uploadedBy,
    uploadedAt: result.uploadedAt.toISOString(),
    releasedAt: result.releasedAt?.toISOString() ?? null,
    fileUrl: `/api/results/${result.id}/file`,
  };
}

function toQueueItem(item: ReviewQueueItem): ReviewQueueItemView {
  return { ...item, releasedAt: item.releasedAt?.toISOString() ?? null };
}

export function presentAppointmentResults(
  output: AppointmentResultsOutput,
): HttpResponse<AppointmentResults> {
  return {
    status: 200,
    body: {
      ...output,
      tests: output.tests.map((test) => ({
        ...test,
        result: test.result && toResultView(test.result),
      })),
    },
  };
}

export function presentReviewQueue(output: ReviewQueueOutput): HttpResponse<ReviewQueue> {
  return { status: 200, body: { ...output, items: output.items.map(toQueueItem) } };
}

export function presentMyResults(
  items: (ReviewQueueItem & { state: MyResult["state"] })[],
): HttpResponse<MyResult[]> {
  return { status: 200, body: items.map((item) => ({ ...toQueueItem(item), state: item.state })) };
}

/** A short-lived link to follow, or the file itself, opened in the browser (not cached). */
export function presentResultFile(delivery: FileDelivery): HttpResponse {
  const headers = { "Cache-Control": "private, no-store" };
  if (delivery.kind === "redirect")
    return { status: 302, body: undefined, redirect: delivery.url, headers };
  const filename = delivery.filename.replace(/["\\\r\n]/g, "_");
  return {
    status: 200,
    body: delivery.data,
    headers: {
      ...headers,
      "Content-Type": delivery.mimeType,
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  };
}
