/** How busy one med team already is on a date. */
export interface TeamLoad {
  /** Visits on that date (any slot). */
  total: number;
  /** Slot starts that already have one of its visits. */
  slots: readonly string[];
}

export interface TeamChoice {
  teamId: string;
  name: string;
  /** Visits it already has that day. */
  visitsThatDay: number;
  /** Whether it can take a visit at this slot: free then and under the daily cap. */
  available: boolean;
}

const EMPTY: TeamLoad = { total: 0, slots: [] };

/**
 * Business rule: each team on duty, and whether it can take a visit at `slot`. A team does one
 * visit per slot and at most `visitsPerTeamPerDay` a day. `except` leaves out the slot of the
 * visit being moved (its current team is still free for it).
 */
export function teamChoices(
  teamsOnDuty: readonly { id: string; name: string }[],
  loads: ReadonlyMap<string, TeamLoad>,
  slot: string,
  visitsPerTeamPerDay: number,
): TeamChoice[] {
  return teamsOnDuty
    .map((team) => {
      const load = loads.get(team.id) ?? EMPTY;
      return {
        teamId: team.id,
        name: team.name,
        visitsThatDay: load.total,
        available: !load.slots.includes(slot) && load.total < visitsPerTeamPerDay,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Automatic assignment: the free team with the fewest visits that day; ties go A–Z. */
export function pickTeam(choices: readonly TeamChoice[]): TeamChoice | null {
  return (
    choices
      .filter((choice) => choice.available)
      .sort((a, b) => a.visitsThatDay - b.visitsThatDay || a.name.localeCompare(b.name))[0] ?? null
  );
}
