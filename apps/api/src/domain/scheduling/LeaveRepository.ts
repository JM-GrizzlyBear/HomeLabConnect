import type { LeaveRequest, LeaveStatus } from "./leave.js";
import type { LeaveDays } from "./shift.js";

export type NewLeaveRequest = Omit<LeaveRequest, "id" | "decisions">;

/** Port: leave requests and their decisions. */
export interface LeaveRepository {
  create(request: NewLeaveRequest): Promise<LeaveRequest>;
  findById(id: string): Promise<LeaveRequest | null>;
  /** Newest first. */
  listForUser(userId: string): Promise<LeaveRequest[]>;
  /** Everyone's, newest first; only `status` when given. */
  list(status: LeaveStatus | null): Promise<LeaveRequest[]>;
  /** Saves the status, current step and decisions. */
  update(request: LeaveRequest): Promise<void>;
  /** Approved leave overlapping `from`–`to`, by user id. */
  approvedDays(
    userIds: readonly string[],
    from: string,
    to: string,
  ): Promise<Map<string, LeaveDays[]>>;
}
