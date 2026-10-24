import type { BaseRole } from "../identity/baseRole.js";
import { addDays } from "../time/businessDate.js";
import type { Roster } from "./roster.js";
import {
  InvalidLeave,
  LeaveNotCancellable,
  LeaveNotPending,
  LeaveOverlap,
  NotYourLeaveStep,
} from "./schedulingErrors.js";

export type LeaveType = "vacation" | "sick" | "emergency" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
/** Who decides a step: the requester's team lead, or an admin. */
export type ApprovalStep = "team_lead" | "admin";

/** The longest a single request may be. */
export const MAX_LEAVE_DAYS = 30;
/** How far back sick and emergency leave may start (filed after the fact). */
export const BACKDATE_DAYS = 7;

export interface LeaveDetails {
  type: LeaveType;
  /** First and last day off, both included. */
  startsOn: string;
  endsOn: string;
  reason: string;
}

export interface LeaveDecision {
  /** Index into the chain. */
  step: number;
  approverId: string;
  decision: "approved" | "rejected";
  note: string | null;
  decidedAt: Date;
}

export interface LeaveRequest extends LeaveDetails {
  id: string;
  userId: string;
  status: LeaveStatus;
  /** The steps it goes through, fixed when it's filed. */
  chain: ApprovalStep[];
  /** Index of the step waiting for a decision. */
  currentStep: number;
  /** The requester's team lead when it was filed; decides the "team_lead" step. */
  teamLeadId: string | null;
  decisions: LeaveDecision[];
}

/** Someone deciding a step: who they are and what they may do. */
export interface Approver {
  id: string;
  role: BaseRole;
  permissions: ReadonlySet<string>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (from: string, to: string) =>
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS;

const rules: {
  holds(details: LeaveDetails, today: string): boolean;
  message: string;
}[] = [
  {
    holds: ({ endsOn, startsOn }) => endsOn >= startsOn,
    message: "The last day can't be before the first.",
  },
  {
    holds: ({ startsOn, endsOn }) => daysBetween(startsOn, endsOn) < MAX_LEAVE_DAYS,
    message: `A request can be at most ${MAX_LEAVE_DAYS} days. File longer leave in parts.`,
  },
  {
    holds: ({ type, startsOn }, today) =>
      startsOn >=
      (type === "sick" || type === "emergency" ? addDays(today, -BACKDATE_DAYS) : today),
    message: `Leave can't start in the past (sick and emergency leave: up to ${BACKDATE_DAYS} days back).`,
  },
  { holds: ({ reason }) => reason.length > 0, message: "Give a reason." },
];

/** Trims the reason and applies the rules. `today` is the business date. */
export function checkLeaveDetails(input: LeaveDetails, today: string): LeaveDetails {
  const details = { ...input, reason: input.reason.trim() };
  const broken = rules.find((rule) => !rule.holds(details, today));
  if (broken) throw new InvalidLeave(broken.message);
  return details;
}

/** Business rule: nobody has two pending or approved requests covering the same day. */
export function assertNoOverlap(details: LeaveDetails, existing: readonly LeaveRequest[]): void {
  const clash = existing.some(
    (other) =>
      (other.status === "pending" || other.status === "approved") &&
      other.startsOn <= details.endsOn &&
      details.startsOn <= other.endsOn,
  );
  if (clash) throw new LeaveOverlap();
}

/**
 * Business rule: a med team member on a team goes to their team lead first,
 * then an admin. Team leads, med team on no team, doctors, support and admins
 * go straight to an admin.
 */
export function approvalChain(
  requester: { id: string; role: BaseRole },
  roster: Roster | null,
): { chain: ApprovalStep[]; teamLeadId: string | null } {
  const lead = roster?.leadUserId ?? null;
  if (requester.role === "med_team" && lead && lead !== requester.id) {
    return { chain: ["team_lead", "admin"], teamLeadId: lead };
  }
  return { chain: ["admin"], teamLeadId: null };
}

/**
 * Who may decide the waiting step: the team lead step goes to the requester's
 * lead, or a non-admin with leave.approve (e.g. a Senior Med Tech); the admin
 * step to an admin with leave.approve. Nobody decides their own request.
 */
export function canDecide(request: LeaveRequest, approver: Approver): boolean {
  if (request.status !== "pending" || approver.id === request.userId) return false;
  const step = request.chain[request.currentStep];
  const mayApprove = approver.permissions.has("leave.approve");
  if (step === "team_lead") {
    return approver.id === request.teamLeadId || (mayApprove && approver.role !== "admin");
  }
  return step === "admin" && mayApprove && approver.role === "admin";
}

/** Records a decision. A rejection ends it; approving the last step approves it. */
export function decide(
  request: LeaveRequest,
  approver: Approver,
  decision: "approved" | "rejected",
  note: string | null,
  now: Date,
): LeaveRequest {
  if (request.status !== "pending") throw new LeaveNotPending();
  if (!canDecide(request, approver)) throw new NotYourLeaveStep();
  const decisions = [
    ...request.decisions,
    { step: request.currentStep, approverId: approver.id, decision, note, decidedAt: now },
  ];
  if (decision === "rejected") return { ...request, decisions, status: "rejected" };
  const isLast = request.currentStep === request.chain.length - 1;
  return isLast
    ? { ...request, decisions, status: "approved" }
    : { ...request, decisions, currentStep: request.currentStep + 1 };
}

/** The requester cancels pending leave, or approved leave that hasn't started yet. */
export function cancel(request: LeaveRequest, userId: string, today: string): LeaveRequest {
  const cancellable =
    request.userId === userId &&
    (request.status === "pending" || (request.status === "approved" && request.startsOn > today));
  if (!cancellable) throw new LeaveNotCancellable();
  return { ...request, status: "cancelled" };
}
