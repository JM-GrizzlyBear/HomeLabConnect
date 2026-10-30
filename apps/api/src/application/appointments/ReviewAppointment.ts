import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import { AppointmentStatusConflict } from "../../domain/appointments/appointmentErrors.js";
import {
  type AppointmentReview,
  assertReviewable,
  type ReviewRepository,
} from "../../domain/appointments/review.js";
import type { Clock } from "../ports/Clock.js";
import { type AppointmentViewer, findVisible } from "./GetAppointment.js";

/** A visit's review: its patient and staff see it (anyone else gets 404). */
export class GetAppointmentReview {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly reviews: ReviewRepository,
  ) {}

  async execute(id: string, viewer: AppointmentViewer): Promise<AppointmentReview | null> {
    await findVisible(this.appointments, id, viewer);
    return await this.reviews.find(id);
  }
}

/** The patient rates their own finished visit 1–5, once. */
export class ReviewAppointment {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly reviews: ReviewRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    id: string;
    patientId: string;
    rating: number;
    comment: string | null;
  }): Promise<AppointmentReview> {
    const appointment = await findVisible(this.appointments, input.id, {
      userId: input.patientId,
      canViewAll: false,
    });
    assertReviewable(appointment.status);
    if (await this.reviews.find(input.id)) {
      throw new AppointmentStatusConflict("You've already rated this visit.");
    }
    return await this.reviews.create({
      appointmentId: input.id,
      patientId: input.patientId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
      createdAt: this.clock.now(),
    });
  }
}
