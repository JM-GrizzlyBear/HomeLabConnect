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

export async function fetchSettings(
  token: string,
  signal?: AbortSignal,
): Promise<SettingsResponse> {
  return settingsResponseSchema.parse(await apiRequest("/settings", { token, signal }));
}

export async function saveSettings(
  token: string,
  settings: SystemSettings,
): Promise<SettingsResponse> {
  return settingsResponseSchema.parse(
    await apiRequest("/settings", { method: "PUT", body: settings, token }),
  );
}

/** One-time closed days in `year`, plus every yearly one. */
export async function fetchClosedDays(
  token: string,
  year: number,
  signal?: AbortSignal,
): Promise<ClosedDay[]> {
  return closedDayListSchema.parse(await apiRequest(`/holidays?year=${year}`, { token, signal }));
}

export async function createClosedDay(
  token: string,
  request: ClosedDayRequest,
): Promise<ClosedDay> {
  return closedDaySchema.parse(
    await apiRequest("/holidays", { method: "POST", body: request, token }),
  );
}

export async function updateClosedDay(
  token: string,
  id: string,
  request: ClosedDayRequest,
): Promise<ClosedDay> {
  return closedDaySchema.parse(
    await apiRequest(`/holidays/${id}`, { method: "PUT", body: request, token }),
  );
}

export async function deleteClosedDay(token: string, id: string): Promise<void> {
  await apiRequest(`/holidays/${id}`, { method: "DELETE", token });
}
