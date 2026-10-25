import type {
  TeamChoice as TeamChoiceView,
  AppointmentList,
  AppointmentView,
  DayAvailability,
  Quote,
} from "@homelabconnect/shared";
import type { AppointmentOutput } from "../../../application/appointments/appointmentOutput.js";
import type { ListAppointmentsOutput } from "../../../application/appointments/ListAppointments.js";
import type { QuoteOutput } from "../../../application/appointments/QuoteBooking.js";
import type { AppointmentLine } from "../../../domain/appointments/appointment.js";
import type { DayAvailability as DayAvailabilityOutput } from "../../../domain/appointments/availability.js";
import type { Appointment } from "../../../domain/appointments/appointment.js";
import type { TeamChoice } from "../../../domain/appointments/teamAssignment.js";
import type { HttpResponse } from "../httpTypes.js";

const toLine = (line: AppointmentLine) => ({
  procedureId: line.procedureId,
  code: line.code,
  name: line.name,
  priceCentavos: line.priceCentavos,
  promotionName: line.promotionName,
  discountCentavos: line.discountCentavos,
  collected: line.collected,
});

function toAppointmentView(output: AppointmentOutput): AppointmentView {
  return {
    id: output.id,
    code: output.code,
    patient: {
      id: output.patientId,
      name: output.patientName,
      email: output.patientEmail,
      phone: output.patientPhone,
    },
    date: output.date,
    slot: output.slot,
    status: output.status,
    address: output.address,
    landmark: output.landmark,
    notes: output.notes,
    lines: output.lines.map(toLine),
    subtotalCentavos: output.subtotalCentavos,
    discountCentavos: output.discountCentavos,
    totalCentavos: output.totalCentavos,
    paymentStatus: output.paymentStatus,
    decisionNote: output.decisionNote,
    team: output.team,
    collectionNote: output.collectionNote,
    proposal: output.openProposal && {
      date: output.openProposal.date,
      slot: output.openProposal.slot,
      reason: output.openProposal.reason,
    },
    cancellableUntil: output.cancellableUntil?.toISOString() ?? null,
    events: output.events.map((event) => ({
      at: event.at.toISOString(),
      actorName: event.actorName,
      kind: event.kind,
      note: event.note,
    })),
    createdAt: output.createdAt.toISOString(),
  };
}

export function presentAppointment(
  output: AppointmentOutput,
  status = 200,
): HttpResponse<AppointmentView> {
  return { status, body: toAppointmentView(output) };
}

export function presentAppointments(outputs: AppointmentOutput[]): HttpResponse<AppointmentView[]> {
  return { status: 200, body: outputs.map(toAppointmentView) };
}

export function presentAppointmentList(
  output: ListAppointmentsOutput,
): HttpResponse<AppointmentList> {
  return {
    status: 200,
    body: { ...output, items: output.items.map(toAppointmentView) },
  };
}

export function presentAvailability(
  days: DayAvailabilityOutput[],
): HttpResponse<DayAvailability[]> {
  return { status: 200, body: days };
}

export function presentQuote(quote: QuoteOutput): HttpResponse<Quote> {
  return { status: 200, body: { ...quote, lines: quote.lines.map(toLine) } };
}

export function presentTeamChoices(choices: TeamChoice[]): HttpResponse<TeamChoiceView[]> {
  return { status: 200, body: choices };
}

/** A med team's visits: the same view, without the patient's cancel deadline. */
export function presentVisits(visits: Appointment[]): HttpResponse<AppointmentView[]> {
  return {
    status: 200,
    body: visits.map((visit) => toAppointmentView({ ...visit, cancellableUntil: null })),
  };
}

export function presentVisit(visit: Appointment): HttpResponse<AppointmentView> {
  return { status: 200, body: toAppointmentView({ ...visit, cancellableUntil: null }) };
}
