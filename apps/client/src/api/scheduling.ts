import {
  type BaseRole,
  copyRostersResponseSchema,
  type LeaveDecisionRequest,
  leaveListSchema,
  type LeaveRequestBody,
  type LeaveStatus,
  type LeaveView,
  leaveViewSchema,
  type MedTeamRequest,
  type RosterRequest,
  type ScheduleDay,
  scheduleDayListSchema,
  type ShiftBoard,
  shiftBoardSchema,
  type ShiftDaysRequest,
  shiftDaysResponseSchema,
  type StaffMember,
  staffListSchema,
  type TeamBoard,
  teamBoardSchema,
  type TeamSummary,
  teamSummarySchema,
} from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

/** The teams and rosters for the two-week period containing `date` (today when null). */
export async function fetchTeamBoard(
  token: string,
  date: string | null,
  signal?: AbortSignal,
): Promise<TeamBoard> {
  const query = date ? `?date=${date}` : "";
  return teamBoardSchema.parse(await apiRequest(`/teams${query}`, { token, signal }));
}

export async function createTeam(token: string, request: MedTeamRequest): Promise<TeamSummary> {
  return teamSummarySchema.parse(
    await apiRequest("/teams", { method: "POST", body: request, token }),
  );
}

export async function updateTeam(
  token: string,
  id: string,
  request: MedTeamRequest,
): Promise<TeamSummary> {
  return teamSummarySchema.parse(
    await apiRequest(`/teams/${id}`, { method: "PUT", body: request, token }),
  );
}

export async function setTeamStatus(
  token: string,
  id: string,
  isActive: boolean,
): Promise<TeamSummary> {
  return teamSummarySchema.parse(
    await apiRequest(`/teams/${id}/status`, { method: "PATCH", body: { isActive }, token }),
  );
}

export async function saveRoster(
  token: string,
  teamId: string,
  periodStart: string,
  request: RosterRequest,
): Promise<void> {
  await apiRequest(`/teams/${teamId}/rosters/${periodStart}`, {
    method: "PUT",
    body: request,
    token,
  });
}

/** Returns how many rosters were copied. */
export async function copyPreviousRosters(token: string, periodStart: string): Promise<number> {
  const result = copyRostersResponseSchema.parse(
    await apiRequest(`/rosters/${periodStart}/copy-previous`, { method: "POST", token }),
  );
  return result.copied;
}

export async function fetchStaff(
  token: string,
  role: BaseRole,
  signal?: AbortSignal,
): Promise<StaffMember[]> {
  return staffListSchema.parse(await apiRequest(`/staff?role=${role}`, { token, signal }));
}

export async function fetchMySchedule(
  token: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<ScheduleDay[]> {
  return scheduleDayListSchema.parse(
    await apiRequest(`/shifts/mine?from=${from}&to=${to}`, { token, signal }),
  );
}

export async function fetchShiftBoard(
  token: string,
  from: string,
  to: string,
  role: BaseRole | null,
  signal?: AbortSignal,
): Promise<ShiftBoard> {
  const roleQuery = role ? `&role=${role}` : "";
  return shiftBoardSchema.parse(
    await apiRequest(`/shifts?from=${from}&to=${to}${roleQuery}`, { token, signal }),
  );
}

/** Gives the picked days the same hours, or makes them days off with null. Returns how many changed. */
export async function saveShiftDays(
  token: string,
  userId: string,
  request: ShiftDaysRequest,
): Promise<number> {
  const result = shiftDaysResponseSchema.parse(
    await apiRequest(`/shifts/${userId}/days`, { method: "PUT", body: request, token }),
  );
  return result.changed;
}

export async function requestLeave(token: string, request: LeaveRequestBody): Promise<LeaveView> {
  return leaveViewSchema.parse(
    await apiRequest("/leave", { method: "POST", body: request, token }),
  );
}

export async function fetchMyLeave(token: string, signal?: AbortSignal): Promise<LeaveView[]> {
  return leaveListSchema.parse(await apiRequest("/leave/mine", { token, signal }));
}

export async function cancelLeave(token: string, id: string): Promise<LeaveView> {
  return leaveViewSchema.parse(await apiRequest(`/leave/${id}/cancel`, { method: "PATCH", token }));
}

/** Requests waiting at a step the signed-in person may decide. */
export async function fetchLeaveInbox(token: string, signal?: AbortSignal): Promise<LeaveView[]> {
  return leaveListSchema.parse(await apiRequest("/leave/inbox", { token, signal }));
}

export async function decideLeave(
  token: string,
  id: string,
  request: LeaveDecisionRequest,
): Promise<LeaveView> {
  return leaveViewSchema.parse(
    await apiRequest(`/leave/${id}/decision`, { method: "POST", body: request, token }),
  );
}

export async function fetchAllLeave(
  token: string,
  status: LeaveStatus | null,
  signal?: AbortSignal,
): Promise<LeaveView[]> {
  const query = status ? `?status=${status}` : "";
  return leaveListSchema.parse(await apiRequest(`/leave${query}`, { token, signal }));
}
