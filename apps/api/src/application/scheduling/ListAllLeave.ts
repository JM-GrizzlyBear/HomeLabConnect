import type { LeaveStatus } from "../../domain/scheduling/leave.js";
import type { LeaveRepository } from "../../domain/scheduling/LeaveRepository.js";
import type { StaffDirectory } from "../../domain/scheduling/StaffDirectory.js";
import { type LeaveView, toLeaveViews } from "./leaveView.js";

export interface ListAllLeaveInput {
  status: LeaveStatus | null;
}

/** Everyone's leave requests, newest first, for people with leave.view. */
export class ListAllLeave {
  constructor(
    private readonly leave: LeaveRepository,
    private readonly staff: StaffDirectory,
  ) {}

  async execute({ status }: ListAllLeaveInput): Promise<LeaveView[]> {
    return toLeaveViews(await this.leave.list(status), this.staff);
  }
}
