import type { LeaveView as LeaveViewOutput } from "../../../application/scheduling/leaveView.js";
import type {
  LeaveView,
  ScheduleDay,
  ShiftBoard,
  StaffMember,
  TeamBoard,
  TeamSummary,
} from "@homelabconnect/shared";
import type { ShiftBoardRow } from "../../../application/scheduling/GetShiftBoard.js";
import type { ScheduleDay as DomainScheduleDay } from "../../../domain/scheduling/shift.js";
import type { StaffMember as DirectoryMember } from "../../../domain/scheduling/StaffDirectory.js";
import type { TeamBoard as TeamBoardOutput } from "../../../application/scheduling/ListTeams.js";
import type { MedTeam } from "../../../domain/scheduling/medTeam.js";
import type { HttpResponse } from "../httpTypes.js";

export function presentTeamBoard(board: TeamBoardOutput): HttpResponse<TeamBoard> {
  return {
    status: 200,
    body: {
      periodStart: board.periodStart,
      periodEnd: board.periodEnd,
      teams: board.teams.map((team) => ({
        id: team.id,
        name: team.name,
        area: team.area,
        isActive: team.isActive,
        lead: team.lead,
        members: team.members,
      })),
      unassigned: board.unassigned,
    },
  };
}

export function presentTeam(team: MedTeam, status = 200): HttpResponse<TeamSummary> {
  return {
    status,
    body: { id: team.id, name: team.name, area: team.area, isActive: team.isActive },
  };
}

function toScheduleDay(day: DomainScheduleDay): ScheduleDay {
  return {
    date: day.date,
    status: day.status,
    start: day.start,
    end: day.end,
    label: day.label,
  };
}

export function presentSchedule(days: DomainScheduleDay[]): HttpResponse<ScheduleDay[]> {
  return { status: 200, body: days.map(toScheduleDay) };
}

export function presentShiftBoard(rows: ShiftBoardRow[]): HttpResponse<ShiftBoard> {
  return {
    status: 200,
    body: rows.map((row) => ({
      person: {
        id: row.person.id,
        firstName: row.person.firstName,
        lastName: row.person.lastName,
        role: row.person.role,
      },
      days: row.days.map(toScheduleDay),
    })),
  };
}

export function presentChangedDays(changed: number): HttpResponse<{ changed: number }> {
  return { status: 200, body: { changed } };
}

function toLeaveView(view: LeaveViewOutput): LeaveView {
  return {
    id: view.id,
    userId: view.userId,
    requesterName: view.requesterName,
    type: view.type,
    startsOn: view.startsOn,
    endsOn: view.endsOn,
    reason: view.reason,
    status: view.status,
    chain: view.chain,
    waitingFor: view.waitingFor,
    decisions: view.decisions.map((decision) => ({
      step: decision.step,
      approverName: decision.approverName,
      decision: decision.decision,
      note: decision.note,
      decidedAt: decision.decidedAt.toISOString(),
    })),
  };
}

export function presentLeave(view: LeaveViewOutput, status = 200): HttpResponse<LeaveView> {
  return { status, body: toLeaveView(view) };
}

export function presentLeaveList(views: LeaveViewOutput[]): HttpResponse<LeaveView[]> {
  return { status: 200, body: views.map(toLeaveView) };
}

export function presentCopiedRosters(copied: number): HttpResponse<{ copied: number }> {
  return { status: 200, body: { copied } };
}

export function presentStaffList(staff: DirectoryMember[]): HttpResponse<StaffMember[]> {
  return {
    status: 200,
    body: staff.map((person) => ({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      role: person.role,
    })),
  };
}
