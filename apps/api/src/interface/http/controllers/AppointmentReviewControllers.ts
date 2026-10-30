import { appointmentIdParamsSchema, reviewAppointmentRequestSchema } from "@homelabconnect/shared";
import type {
  GetAppointmentReview,
  ReviewAppointment,
} from "../../../application/appointments/ReviewAppointment.js";
import type { AppointmentReview } from "../../../domain/appointments/review.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";

const toView = (review: AppointmentReview | null) =>
  review && {
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };

/** The visit's patient, or staff who see every appointment (404 otherwise). */
export class GetAppointmentReviewController implements Controller {
  constructor(private readonly getAppointmentReview: GetAppointmentReview) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { userId, permissions } = requireAuth(request);
    const review = await this.getAppointmentReview.execute(id, {
      userId,
      canViewAll: permissions.has("appointments.view_all"),
    });
    return { status: 200, body: toView(review) };
  }
}

export class ReviewAppointmentController implements Controller {
  constructor(private readonly reviewAppointment: ReviewAppointment) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const body = parseRequest(reviewAppointmentRequestSchema, request.body);
    const review = await this.reviewAppointment.execute({
      id,
      patientId: requireAuth(request).userId,
      ...body,
    });
    return { status: 201, body: toView(review) };
  }
}
