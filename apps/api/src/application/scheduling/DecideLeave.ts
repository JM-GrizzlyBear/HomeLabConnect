import { type Approver, decide } from "../../domain/scheduling/leave.js";
import { LeaveNotFound } from "../../domain/scheduling/schedulingErrors.js";
import type { Clock } from "../ports/clock.js";
import type { LeaveRepository } from "../ports/leaveRepository.js";
import type { StaffDirectory } from "../ports/staffDirectory.js";
import { type LeaveView, toLeaveViews } from "./leaveView.js";

export interface DecideLeaveInput {
  id: string;
  approver: Approver;
  decision: "approved" | "rejected";
  note: string | null;
}

/** A team lead or admin approves or rejects the step a request is waiting at. */
export class DecideLeave {
  constructor(
    private readonly leave: LeaveRepository,
    private readonly staff: StaffDirectory,
    private readonly clock: Clock,
  ) {}

  async execute({ id, approver, decision, note }: DecideLeaveInput): Promise<LeaveView> {
    const request = await this.leave.findById(id);
    if (!request) throw new LeaveNotFound();
    const decided = decide(request, approver, decision, note?.trim() || null, this.clock.now());
    await this.leave.update(decided);
    const [view] = await toLeaveViews([decided], this.staff);
    if (!view) throw new LeaveNotFound();
    return view;
  }
}
