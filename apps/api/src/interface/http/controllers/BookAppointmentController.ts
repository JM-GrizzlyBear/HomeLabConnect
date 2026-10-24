import { bookAppointmentRequestSchema } from "@homelabconnect/shared";
import type { BookAppointment } from "../../../application/appointments/BookAppointment.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentAppointment } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class BookAppointmentController implements Controller {
  constructor(private readonly bookAppointment: BookAppointment) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(bookAppointmentRequestSchema, request.body);
    const booked = await this.bookAppointment.execute({
      ...body,
      patientId: requireAuth(request).userId,
    });
    return presentAppointment(booked, 201);
  }
}
