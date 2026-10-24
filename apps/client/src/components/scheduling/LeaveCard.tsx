import type { LeaveView } from "@homelabconnect/shared";
import { CheckIcon, ClockIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  approvalTrail,
  formatLeaveDates,
  leaveStatusBadge,
  leaveStatusLabels,
  leaveTypeLabels,
} from "../../format/leave";

interface LeaveCardProps {
  leave: LeaveView;
  /** Show who asked, for approvers' lists. */
  showRequester?: boolean;
  actions?: ReactNode;
}

const trailIcons = {
  approved: <CheckIcon className="size-3.5 text-emerald-600" aria-hidden />,
  rejected: <XIcon className="size-3.5 text-destructive" aria-hidden />,
  waiting: <ClockIcon className="size-3.5 text-amber-600" aria-hidden />,
  skipped: null,
};

/** One leave request: what, when, why, and where it is in the approval chain. */
export function LeaveCard({ leave, showRequester = false, actions }: LeaveCardProps) {
  const trail = approvalTrail(leave);
  return (
    <li className="grid gap-2 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-800">
            {showRequester && `${leave.requesterName} · `}
            {leaveTypeLabels[leave.type]} leave
          </p>
          <p className="text-sm text-muted-foreground">{formatLeaveDates(leave)}</p>
        </div>
        <Badge variant={leaveStatusBadge[leave.status]}>{leaveStatusLabels[leave.status]}</Badge>
      </div>
      <p className="text-sm text-slate-700">{leave.reason}</p>
      <ol
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
        aria-label="Approval steps"
      >
        {trail.map((step, index) => (
          <li
            key={index}
            className={cn("flex items-center gap-1", step.state === "waiting" && "text-amber-700")}
          >
            {trailIcons[step.state]}
            <span className="font-medium">{step.label}</span>
            {step.by ? (
              <span>
                {step.state === "approved" ? "approved" : "rejected"} by {step.by}
                {step.note && ` · “${step.note}”`}
              </span>
            ) : (
              <span>{step.state === "waiting" ? "waiting" : "—"}</span>
            )}
          </li>
        ))}
      </ol>
      {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
    </li>
  );
}
