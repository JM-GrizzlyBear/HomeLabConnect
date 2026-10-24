import { type Approver, canDecide } from "../../domain/scheduling/leave.js";
import type { LeaveRepository } from "../ports/leaveRepository.js";
import type { StaffDirectory } from "../ports/staffDirectory.js";
import { type LeaveView, toLeaveViews } from "./leaveView.js";

/** Pending requests waiting at a step this approver may decide, oldest first. */
export class ListLeaveInbox {
  constructor(
    private readonly leave: LeaveRepository,
    private readonly staff: StaffDirectory,
  ) {}

  async execute(approver: Approver): Promise<LeaveView[]> {
    const pending = await this.leave.list("pending");
    const mine = pending.filter((request) => canDecide(request, approver)).reverse();
    return toLeaveViews(mine, this.staff);
  }
}
