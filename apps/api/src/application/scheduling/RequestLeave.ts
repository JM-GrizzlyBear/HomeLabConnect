import {
  approvalChain,
  assertNoOverlap,
  checkLeaveDetails,
  type LeaveDetails,
} from "../../domain/scheduling/leave.js";
import { rosterOf, rosterPeriodOf } from "../../domain/scheduling/roster.js";
import { StaffNotFound } from "../../domain/scheduling/schedulingErrors.js";
import { businessDate } from "../../domain/time/businessDate.js";
import type { Clock } from "../ports/Clock.js";
import type { LeaveRepository } from "../../domain/scheduling/LeaveRepository.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";
import type { StaffDirectory } from "../../domain/scheduling/StaffDirectory.js";
import { type LeaveView, toLeaveViews } from "./leaveView.js";

export interface RequestLeaveInput extends LeaveDetails {
  userId: string;
}

/**
 * A staff member files leave. Who approves it is fixed now, from their role
 * and the team they're on in the period the leave starts.
 */
export class RequestLeave {
  constructor(
    private readonly leave: LeaveRepository,
    private readonly teams: MedTeamRepository,
    private readonly staff: StaffDirectory,
    private readonly clock: Clock,
  ) {}

  async execute({ userId, ...input }: RequestLeaveInput): Promise<LeaveView> {
    const requester = (await this.staff.listActive(null)).find((person) => person.id === userId);
    if (!requester) throw new StaffNotFound();

    const details = checkLeaveDetails(input, businessDate(this.clock.now()));
    assertNoOverlap(details, await this.leave.listForUser(userId));

    const rosters = await this.teams.listRosters(rosterPeriodOf(details.startsOn));
    const { chain, teamLeadId } = approvalChain(requester, rosterOf(userId, rosters));
    const created = await this.leave.create({
      ...details,
      userId,
      status: "pending",
      chain,
      currentStep: 0,
      teamLeadId,
    });
    const [view] = await toLeaveViews([created], this.staff);
    if (!view) throw new Error("A new leave request had no view.");
    return view;
  }
}
