import type { Appointment } from "../../domain/appointments/appointment.js";
import type { StaffNoticeKind } from "../../domain/notifications/notification.js";
import { leaveNotice, visitNotice } from "../../domain/notifications/notification.js";
import type { LeaveRequest } from "../../domain/scheduling/leave.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";
import { rosterPeriodOf } from "../../domain/scheduling/roster.js";
import type { Notifier } from "./Notifier.js";

/** Tells the visit's med team (everyone on its roster that period) about a change to it. */
export async function alertTeam(
  notifier: Notifier,
  teams: MedTeamRepository,
  appointment: Appointment,
  kind: Extract<StaffNoticeKind, "visit_assigned" | "visit_changed" | "visit_cancelled">,
  exceptId: string | null = null,
): Promise<void> {
  if (!appointment.team) return;
  try {
    const rosters = await teams.listRosters(rosterPeriodOf(appointment.date));
    const roster = rosters.find((candidate) => candidate.teamId === appointment.team?.id);
    if (!roster) return;
    await notifier.toUsers(
      [roster.leadUserId, ...roster.memberIds],
      visitNotice(kind, appointment),
      exceptId,
    );
  } catch (error) {
    console.error(`Could not find the team to tell about ${appointment.code}:`, error);
  }
}

/** A paid visit that won't go ahead needs an admin to refund it. */
export async function alertRefundNeeded(
  notifier: Notifier,
  appointment: Appointment,
): Promise<void> {
  if (appointment.paymentStatus !== "paid" && appointment.paymentStatus !== "partially_refunded") {
    return;
  }
  await notifier.toRoles(
    ["admin"],
    visitNotice("refund_needed", appointment, "/app/payments/refunds"),
  );
}

/**
 * A leave request waiting at a step goes to whoever decides it (the team lead, or admins); a
 * finished one goes back to the person who asked.
 */
export async function alertLeave(
  notifier: Notifier,
  request: LeaveRequest,
  requesterName: string,
): Promise<void> {
  const leave = { ...request, requesterName };
  if (request.status !== "pending") {
    await notifier.toUsers([request.userId], leaveNotice("leave_decided", leave));
    return;
  }
  const notice = leaveNotice("leave_to_decide", leave);
  if (request.chain[request.currentStep] === "team_lead") {
    await notifier.toUsers([request.teamLeadId], notice, request.userId);
  } else {
    await notifier.toRoles(["admin"], notice, request.userId);
  }
}
