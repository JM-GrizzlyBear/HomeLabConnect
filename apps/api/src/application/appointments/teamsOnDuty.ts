import { rosterPeriodOf } from "../../domain/scheduling/roster.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";
import {
  buildSchedules,
  datesBetween,
  type ScheduleRepositories,
} from "../scheduling/buildSchedules.js";

/**
 * How many med teams can go out on each date: active teams with a roster for that period
 * and at least one member working that day (approved leave counts as not working).
 */
export async function teamsOnDuty(
  from: string,
  to: string,
  teams: MedTeamRepository,
  schedules: ScheduleRepositories,
): Promise<Map<string, number>> {
  const dates = datesBetween(from, to);
  const periods = [...new Set(dates.map(rosterPeriodOf))];
  const activeTeamIds = new Set(
    (await teams.list()).filter((team) => team.isActive).map((team) => team.id),
  );
  const rostersByPeriod = new Map(
    await Promise.all(
      periods.map(async (period) => {
        const rosters = await teams.listRosters(period);
        return [period, rosters.filter((roster) => activeTeamIds.has(roster.teamId))] as const;
      }),
    ),
  );

  const memberIds = [
    ...new Set([...rostersByPeriod.values()].flat().flatMap((roster) => roster.memberIds)),
  ];
  const days =
    memberIds.length > 0 ? await buildSchedules(memberIds, from, to, schedules) : new Map();
  const isWorking = (userId: string, date: string) =>
    days.get(userId)?.find((day: { date: string }) => day.date === date)?.status === "working";

  return new Map(
    dates.map((date) => [
      date,
      (rostersByPeriod.get(rosterPeriodOf(date)) ?? []).filter((roster) =>
        roster.memberIds.some((userId) => isWorking(userId, date)),
      ).length,
    ]),
  );
}
