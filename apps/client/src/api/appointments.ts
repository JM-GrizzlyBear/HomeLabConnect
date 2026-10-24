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
