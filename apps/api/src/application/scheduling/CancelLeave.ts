import { cancel } from "../../domain/scheduling/leave.js";
import { LeaveNotFound } from "../../domain/scheduling/schedulingErrors.js";
import { businessDate } from "../../domain/time/businessDate.js";
import type { Clock } from "../ports/Clock.js";
import type { LeaveRepository } from "../../domain/scheduling/LeaveRepository.js";
import type { StaffDirectory } from "../../domain/scheduling/StaffDirectory.js";
import { type LeaveView, toLeaveViews } from "./leaveView.js";

export interface CancelLeaveInput {
  id: string;
  userId: string;
}

/** The requester withdraws pending leave, or approved leave that hasn't started. */
export class CancelLeave {
  constructor(
    private readonly leave: LeaveRepository,
    private readonly staff: StaffDirectory,
    private readonly clock: Clock,
  ) {}

  async execute({ id, userId }: CancelLeaveInput): Promise<LeaveView> {
    const request = await this.leave.findById(id);
    // Someone else's request looks the same as a missing one.
    if (!request || request.userId !== userId) throw new LeaveNotFound();
    const cancelled = cancel(request, userId, businessDate(this.clock.now()));
    await this.leave.update(cancelled);
    const [view] = await toLeaveViews([cancelled], this.staff);
    if (!view) throw new LeaveNotFound();
    return view;
  }
}
