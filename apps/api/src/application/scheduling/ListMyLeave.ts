import type { LeaveRepository } from "../ports/leaveRepository.js";
import type { StaffDirectory } from "../ports/staffDirectory.js";
import { type LeaveView, toLeaveViews } from "./leaveView.js";

export interface ListMyLeaveInput {
  userId: string;
}

/** A staff member's own requests, newest first, with where each one is. */
export class ListMyLeave {
  constructor(
    private readonly leave: LeaveRepository,
    private readonly staff: StaffDirectory,
  ) {}

  async execute({ userId }: ListMyLeaveInput): Promise<LeaveView[]> {
    return toLeaveViews(await this.leave.listForUser(userId), this.staff);
  }
}
