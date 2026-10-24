import type { ApprovalStep, LeaveDecision, LeaveRequest } from "../../domain/scheduling/leave.js";
import { fullName, type StaffDirectory } from "../ports/staffDirectory.js";

export interface LeaveDecisionView extends LeaveDecision {
  approverName: string;
}

/** A leave request with the names people see, and which step it's waiting at. */
export interface LeaveView extends Omit<LeaveRequest, "decisions"> {
  requesterName: string;
  decisions: LeaveDecisionView[];
  /** The step waiting for a decision, or null once it's decided or cancelled. */
  waitingFor: ApprovalStep | null;
}

/** Adds names to requests, looking everyone up in one go. */
export async function toLeaveViews(
  requests: readonly LeaveRequest[],
  staff: StaffDirectory,
): Promise<LeaveView[]> {
  if (requests.length === 0) return [];
  const names = new Map(
    (await staff.listActive(null)).map((person) => [person.id, fullName(person)]),
  );
  const nameOf = (id: string) => names.get(id) ?? "Former staff";
  return requests.map((request) => ({
    ...request,
    requesterName: nameOf(request.userId),
    decisions: request.decisions.map((decision) => ({
      ...decision,
      approverName: nameOf(decision.approverId),
    })),
    waitingFor: request.status === "pending" ? (request.chain[request.currentStep] ?? null) : null,
  }));
}
