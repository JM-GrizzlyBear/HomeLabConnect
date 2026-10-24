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
  date: string | null,
  signal?: AbortSignal,
): Promise<TeamBoard> {
  const query = date ? `?date=${date}` : "";
  return teamBoardSchema.parse(await apiRequest(`/teams${query}`, { signal }));
}

export async function createTeam(request: MedTeamRequest): Promise<TeamSummary> {
  return teamSummarySchema.parse(await apiRequest("/teams", { method: "POST", body: request }));
}

export async function updateTeam(id: string, request: MedTeamRequest): Promise<TeamSummary> {
  return teamSummarySchema.parse(
    await apiRequest(`/teams/${id}`, { method: "PUT", body: request }),
  );
}

export async function setTeamStatus(id: string, isActive: boolean): Promise<TeamSummary> {
  return teamSummarySchema.parse(
    await apiRequest(`/teams/${id}/status`, { method: "PATCH", body: { isActive } }),
  );
}

export async function saveRoster(
  teamId: string,
  periodStart: string,
  request: RosterRequest,
): Promise<void> {
  await apiRequest(`/teams/${teamId}/rosters/${periodStart}`, {
    method: "PUT",
    body: request,
  });
}

/** Returns how many rosters were copied. */
export async function copyPreviousRosters(periodStart: string): Promise<number> {
  const result = copyRostersResponseSchema.parse(
    await apiRequest(`/rosters/${periodStart}/copy-previous`, { method: "POST" }),
  );
  return result.copied;
}

export async function fetchStaff(role: BaseRole, signal?: AbortSignal): Promise<StaffMember[]> {
  return staffListSchema.parse(await apiRequest(`/staff?role=${role}`, { signal }));
}

export async function fetchMySchedule(
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<ScheduleDay[]> {
  return scheduleDayListSchema.parse(
    await apiRequest(`/shifts/mine?from=${from}&to=${to}`, { signal }),
  );
}

export async function fetchShiftBoard(
  from: string,
  to: string,
  role: BaseRole | null,
  signal?: AbortSignal,
): Promise<ShiftBoard> {
  const roleQuery = role ? `&role=${role}` : "";
  return shiftBoardSchema.parse(
    await apiRequest(`/shifts?from=${from}&to=${to}${roleQuery}`, { signal }),
  );
}

/** Gives the picked days the same hours, or makes them days off with null. Returns how many changed. */
export async function saveShiftDays(userId: string, request: ShiftDaysRequest): Promise<number> {
  const result = shiftDaysResponseSchema.parse(
    await apiRequest(`/shifts/${userId}/days`, { method: "PUT", body: request }),
  );
  return result.changed;
}

export async function requestLeave(request: LeaveRequestBody): Promise<LeaveView> {
  return leaveViewSchema.parse(await apiRequest("/leave", { method: "POST", body: request }));
}

export async function fetchMyLeave(signal?: AbortSignal): Promise<LeaveView[]> {
  return leaveListSchema.parse(await apiRequest("/leave/mine", { signal }));
}

export async function cancelLeave(id: string): Promise<LeaveView> {
  return leaveViewSchema.parse(await apiRequest(`/leave/${id}/cancel`, { method: "PATCH" }));
}

/** Requests waiting at a step the signed-in person may decide. */
export async function fetchLeaveInbox(signal?: AbortSignal): Promise<LeaveView[]> {
  return leaveListSchema.parse(await apiRequest("/leave/inbox", { signal }));
}

export async function decideLeave(id: string, request: LeaveDecisionRequest): Promise<LeaveView> {
  return leaveViewSchema.parse(
    await apiRequest(`/leave/${id}/decision`, { method: "POST", body: request }),
  );
}

export async function fetchAllLeave(
  status: LeaveStatus | null,
  signal?: AbortSignal,
): Promise<LeaveView[]> {
  const query = status ? `?status=${status}` : "";
  return leaveListSchema.parse(await apiRequest(`/leave${query}`, { signal }));
}
