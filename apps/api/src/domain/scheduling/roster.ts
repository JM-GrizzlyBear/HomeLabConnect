import { addDays } from "../time/businessDate.js";
import { InvalidRoster, RosterClash } from "./schedulingErrors.js";

/** Rosters run in fixed two-week periods (Monday to the Sunday after next), counted from here. */
export const ROSTER_ANCHOR = "2026-01-05";
export const ROSTER_PERIOD_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY_MS;

/** The first day (a Monday) of the two-week period containing `date`. */
export function rosterPeriodOf(date: string): string {
  const offset = dayNumber(date) - dayNumber(ROSTER_ANCHOR);
  const periods = Math.floor(offset / ROSTER_PERIOD_DAYS);
  return addDays(ROSTER_ANCHOR, periods * ROSTER_PERIOD_DAYS);
}

/** The last day of the period starting on `periodStart`. */
export function rosterPeriodEnd(periodStart: string): string {
  return addDays(periodStart, ROSTER_PERIOD_DAYS - 1);
}

export function isRosterPeriodStart(date: string): boolean {
  return rosterPeriodOf(date) === date;
}

/** Who is on one team for one two-week period. */
export interface Roster {
  teamId: string;
  periodStart: string;
  /** null only when there are no members. */
  leadUserId: string | null;
  memberIds: string[];
}

export interface RosterCheckContext {
  /** Active med team staff, by id, with their names for messages. */
  eligible: ReadonlyMap<string, string>;
  /** The other teams' rosters in the same period, with each team's name. */
  otherRosters: readonly (Roster & { teamName: string })[];
}

/**
 * Business rules for a roster: it starts on a period start, everyone on it is
 * active med team staff, the lead is one of the members, and nobody is on two
 * teams in the same period. Returns it with duplicate members dropped.
 */
export function checkRoster(input: Roster, context: RosterCheckContext): Roster {
  const roster = { ...input, memberIds: [...new Set(input.memberIds)] };
  if (!isRosterPeriodStart(roster.periodStart)) {
    throw new InvalidRoster("Rosters start on the first Monday of a two-week period.");
  }
  if (roster.memberIds.some((id) => !context.eligible.has(id))) {
    throw new InvalidRoster("Only active med team staff can be on a team.");
  }
  if (roster.memberIds.length === 0 ? roster.leadUserId !== null : !roster.leadUserId) {
    throw new InvalidRoster("Choose the team lead.");
  }
  if (roster.leadUserId && !roster.memberIds.includes(roster.leadUserId)) {
    throw new InvalidRoster("The team lead must be one of the members.");
  }
  for (const other of context.otherRosters) {
    if (other.teamId === roster.teamId) continue;
    const shared = roster.memberIds.find((id) => other.memberIds.includes(id));
    if (shared) throw new RosterClash(context.eligible.get(shared) ?? "Someone", other.teamName);
  }
  return roster;
}

/** The roster `userId` is on in a period, if any. */
export function rosterOf(userId: string, rosters: readonly Roster[]): Roster | null {
  return rosters.find((roster) => roster.memberIds.includes(userId)) ?? null;
}

/** For copying: the same people on the same teams, in a new period. */
export function moveToPeriod(rosters: readonly Roster[], periodStart: string): Roster[] {
  return rosters.map((roster) => ({ ...roster, periodStart }));
}
