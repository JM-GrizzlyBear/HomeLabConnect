import {
  type AppointmentList,
  appointmentListSchema,
  appointmentSchema,
  myAppointmentsSchema,
  type AppointmentStatus,
  type AppointmentView,
  type BookAppointmentRequest,
  type DayAvailability,
  availabilitySchema,
  type ProposeTimeRequest,
  type Quote,
  quoteSchema,
  type AppointmentNoteView,
  appointmentNotesSchema,
  type RecordVisitRequest,
  type RouteTeam,
  routeTeamsSchema,
  type TeamChoice,
  teamChoicesSchema,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchAvailability(
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<DayAvailability[]> {
  return availabilitySchema.parse(
    await apiRequest(`/appointments/availability?from=${from}&to=${to}`, { signal }),
  );
}

export async function fetchQuote(procedureIds: string[], signal?: AbortSignal): Promise<Quote> {
  return quoteSchema.parse(
    await apiRequest(`/appointments/quote?procedureIds=${procedureIds.join(",")}`, { signal }),
  );
}

export async function bookAppointment(request: BookAppointmentRequest): Promise<AppointmentView> {
  return appointmentSchema.parse(
    await apiRequest("/appointments", { method: "POST", body: request }),
  );
}

export async function fetchMyAppointments(signal?: AbortSignal): Promise<AppointmentView[]> {
  return myAppointmentsSchema.parse(await apiRequest("/appointments/mine", { signal }));
}

export async function fetchAppointment(id: string, signal?: AbortSignal): Promise<AppointmentView> {
  return appointmentSchema.parse(await apiRequest(`/appointments/${id}`, { signal }));
}

export interface AppointmentFilters {
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  q?: string;
  page: number;
  pageSize: number;
}

export async function fetchAppointments(
  filters: AppointmentFilters,
  signal?: AbortSignal,
): Promise<AppointmentList> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return appointmentListSchema.parse(await apiRequest(`/appointments?${params}`, { signal }));
}

export async function cancelAppointment(
  id: string,
  reason: string | null,
): Promise<AppointmentView> {
  return appointmentSchema.parse(
    await apiRequest(`/appointments/${id}/cancel`, { method: "PATCH", body: { reason } }),
  );
}

export async function acceptAppointment(id: string): Promise<AppointmentView> {
  return appointmentSchema.parse(
    await apiRequest(`/appointments/${id}/accept`, { method: "POST" }),
  );
}

export async function rejectAppointment(id: string, reason: string): Promise<AppointmentView> {
  return appointmentSchema.parse(
    await apiRequest(`/appointments/${id}/reject`, { method: "POST", body: { reason } }),
  );
}

export async function proposeNewTime(
  id: string,
  request: ProposeTimeRequest,
): Promise<AppointmentView> {
  return appointmentSchema.parse(
    await apiRequest(`/appointments/${id}/reschedule`, { method: "POST", body: request }),
  );
}

export async function answerProposal(id: string, accept: boolean): Promise<AppointmentView> {
  return appointmentSchema.parse(
    await apiRequest(`/appointments/${id}/proposal`, { method: "POST", body: { accept } }),
  );
}

export async function fetchTeamChoices(id: string, signal?: AbortSignal): Promise<TeamChoice[]> {
  return teamChoicesSchema.parse(await apiRequest(`/appointments/${id}/teams`, { signal }));
}

export async function assignTeam(id: string, teamId: string | null): Promise<AppointmentView> {
  return appointmentSchema.parse(
    await apiRequest(`/appointments/${id}/team`, { method: "PUT", body: { teamId } }),
  );
}

export async function fetchMyVisits(
  date: string,
  signal?: AbortSignal,
): Promise<AppointmentView[]> {
  return myAppointmentsSchema.parse(await apiRequest(`/visits/mine?date=${date}`, { signal }));
}

export async function recordVisit(
  id: string,
  record: RecordVisitRequest,
): Promise<AppointmentView> {
  return appointmentSchema.parse(
    await apiRequest(`/visits/${id}`, { method: "POST", body: record }),
  );
}

export async function fetchNotes(id: string, signal?: AbortSignal): Promise<AppointmentNoteView[]> {
  return appointmentNotesSchema.parse(await apiRequest(`/appointments/${id}/notes`, { signal }));
}

/** A note, optionally with a photo or PDF: sent as a form so the file can come along. */
export async function addNote(
  id: string,
  note: { body: string; sharedWithPatient: boolean; file: File | null },
): Promise<AppointmentNoteView[]> {
  const form = new FormData();
  form.append("body", note.body);
  form.append("sharedWithPatient", String(note.sharedWithPatient));
  if (note.file) form.append("file", note.file);
  return appointmentNotesSchema.parse(
    await apiRequest(`/appointments/${id}/notes`, { method: "POST", body: form }),
  );
}

export async function deleteAttachment(id: string, attachmentId: string): Promise<void> {
  await apiRequest(`/appointments/${id}/attachments/${attachmentId}`, { method: "DELETE" });
}

export async function scheduleReturnVisit(
  id: string,
  request: { date: string; slot: string },
): Promise<AppointmentView> {
  return appointmentSchema.parse(
    await apiRequest(`/appointments/${id}/return`, { method: "POST", body: request }),
  );
}

export async function fetchRouteTeams(date: string, signal?: AbortSignal): Promise<RouteTeam[]> {
  return routeTeamsSchema.parse(await apiRequest(`/routes/teams?date=${date}`, { signal }));
}

export async function fetchRoute(
  teamId: string,
  date: string,
  signal?: AbortSignal,
): Promise<AppointmentView[]> {
  return myAppointmentsSchema.parse(
    await apiRequest(`/routes?teamId=${teamId}&date=${date}`, { signal }),
  );
}

export async function reorderRoute(
  teamId: string,
  date: string,
  appointmentIds: string[],
): Promise<AppointmentView[]> {
  return myAppointmentsSchema.parse(
    await apiRequest("/routes", { method: "PUT", body: { teamId, date, appointmentIds } }),
  );
}
