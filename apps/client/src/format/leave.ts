import type { ApprovalStep, LeaveStatus, LeaveType, LeaveView } from "@homelabconnect/shared";
import { differenceInCalendarDays, format, parseISO } from "date-fns";

export const leaveTypeLabels: Record<LeaveType, string> = {
  vacation: "Vacation",
  sick: "Sick",
  emergency: "Emergency",
  other: "Other",
};

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const leaveStatusBadge: Record<
  LeaveStatus,
  "warning" | "success" | "destructive" | "muted"
> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  cancelled: "muted",
};

export const approvalStepLabels: Record<ApprovalStep, string> = {
  team_lead: "Team lead",
  admin: "Admin",
};

/** "Oct 12 – Oct 16 · 5 days", or "Oct 12 · 1 day". */
export function formatLeaveDates(leave: Pick<LeaveView, "startsOn" | "endsOn">): string {
  const days = differenceInCalendarDays(parseISO(leave.endsOn), parseISO(leave.startsOn)) + 1;
  const start = format(parseISO(leave.startsOn), "MMM d");
  const range = days === 1 ? start : `${start} – ${format(parseISO(leave.endsOn), "MMM d, yyyy")}`;
  return `${range} · ${days} ${days === 1 ? "day" : "days"}`;
}

export interface TrailStep {
  label: string;
  state: "approved" | "rejected" | "waiting" | "skipped";
  by: string | null;
  note: string | null;
}

/** Each approval step and what happened at it, for "Team lead ✓ Juan · Admin: waiting". */
export function approvalTrail(leave: LeaveView): TrailStep[] {
  return leave.chain.map((step, index) => {
    const decision = leave.decisions.find((candidate) => candidate.step === index);
    if (decision) {
      return {
        label: approvalStepLabels[step],
        state: decision.decision,
        by: decision.approverName,
        note: decision.note,
      };
    }
    const waiting = leave.status === "pending" && leave.waitingFor === step;
    return {
      label: approvalStepLabels[step],
      state: waiting ? "waiting" : "skipped",
      by: null,
      note: null,
    };
  });
}
