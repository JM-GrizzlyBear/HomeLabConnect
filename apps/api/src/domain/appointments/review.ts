import type { AppointmentStatus } from "./appointment.js";
import { AppointmentStatusConflict } from "./appointmentErrors.js";

/** The patient's rating of a finished visit, given once. */
export interface AppointmentReview {
  appointmentId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export const REVIEW_COMMENT_MAX_LENGTH = 500;

/** Only a visit that happened (collected, or the team came but couldn't collect) is rated. */
export function assertReviewable(status: AppointmentStatus): void {
  if (status !== "collected" && status !== "not_collected") {
    throw new AppointmentStatusConflict("You can rate a visit once it's done.");
  }
}

/** Port: visit reviews. */
export interface ReviewRepository {
  find(appointmentId: string): Promise<AppointmentReview | null>;
  /** Throws AppointmentStatusConflict when the visit already has one. */
  create(review: AppointmentReview & { patientId: string }): Promise<AppointmentReview>;
}
