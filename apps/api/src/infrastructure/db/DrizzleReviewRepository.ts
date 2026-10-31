import { eq } from "drizzle-orm";
import { AppointmentStatusConflict } from "../../domain/appointments/appointmentErrors.js";
import type { AppointmentReview, ReviewRepository } from "../../domain/appointments/review.js";
import type { Database } from "./client.js";
import { isUniqueViolation } from "./errors.js";
import { appointmentReviews } from "./schema/index.js";

const columns = {
  appointmentId: appointmentReviews.appointmentId,
  rating: appointmentReviews.rating,
  comment: appointmentReviews.comment,
  createdAt: appointmentReviews.createdAt,
};

export class DrizzleReviewRepository implements ReviewRepository {
  constructor(private readonly db: Database) {}

  async find(appointmentId: string): Promise<AppointmentReview | null> {
    const [row] = await this.db
      .select(columns)
      .from(appointmentReviews)
      .where(eq(appointmentReviews.appointmentId, appointmentId));
    return row ?? null;
  }

  async create(review: AppointmentReview & { patientId: string }): Promise<AppointmentReview> {
    try {
      const [row] = await this.db
        .insert(appointmentReviews)
        .values({ ...review, patientUserId: review.patientId })
        .returning(columns);
      if (!row) throw new Error("Insert into appointment_reviews returned no row.");
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppointmentStatusConflict("You've already rated this visit.");
      }
      throw error;
    }
  }
}
