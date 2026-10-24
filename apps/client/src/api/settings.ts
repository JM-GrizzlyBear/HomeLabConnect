import {
  type ClosedDay,
  closedDayListSchema,
  type ClosedDayRequest,
  closedDaySchema,
  type SettingsResponse,
  settingsResponseSchema,
  type SystemSettings,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchSettings(signal?: AbortSignal): Promise<SettingsResponse> {
  return settingsResponseSchema.parse(await apiRequest("/settings", { signal }));
}

export async function saveSettings(settings: SystemSettings): Promise<SettingsResponse> {
  return settingsResponseSchema.parse(
    await apiRequest("/settings", { method: "PUT", body: settings }),
  );
}

/** One-time closed days in `year`, plus every yearly one. */
export async function fetchClosedDays(year: number, signal?: AbortSignal): Promise<ClosedDay[]> {
  return closedDayListSchema.parse(await apiRequest(`/holidays?year=${year}`, { signal }));
}

export async function createClosedDay(request: ClosedDayRequest): Promise<ClosedDay> {
  return closedDaySchema.parse(await apiRequest("/holidays", { method: "POST", body: request }));
}

export async function updateClosedDay(id: string, request: ClosedDayRequest): Promise<ClosedDay> {
  return closedDaySchema.parse(
    await apiRequest(`/holidays/${id}`, { method: "PUT", body: request }),
  );
}

export async function deleteClosedDay(id: string): Promise<void> {
  await apiRequest(`/holidays/${id}`, { method: "DELETE" });
}
