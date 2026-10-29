import type {
  ResultRepository,
  ReviewQueueItem,
  ReviewQueueTab,
} from "../../domain/results/ResultRepository.js";

export interface ListReviewQueueInput {
  tab: ReviewQueueTab;
  q: string | null;
  page: number;
  pageSize: number;
}

export interface ReviewQueueOutput {
  items: ReviewQueueItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** Doctors: collected visits still to upload, ready to release, or released. */
export class ListReviewQueue {
  constructor(private readonly results: ResultRepository) {}

  async execute(input: ListReviewQueueInput): Promise<ReviewQueueOutput> {
    const page = await this.results.queue({ ...input, q: input.q?.trim() || null });
    return { ...page, page: input.page, pageSize: input.pageSize };
  }
}

/** A patient's visits whose results are released: each locked until paid, or ready. */
export class ListMyResults {
  constructor(private readonly results: ResultRepository) {}

  async execute(patientId: string): Promise<(ReviewQueueItem & { state: "locked" | "ready" })[]> {
    const released = await this.results.releasedForPatient(patientId);
    return released.map((item) => ({
      ...item,
      state: item.paymentStatus === "unpaid" ? "locked" : "ready",
    }));
  }
}
