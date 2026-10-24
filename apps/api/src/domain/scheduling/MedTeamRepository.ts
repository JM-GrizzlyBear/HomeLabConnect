import type { MedTeam, MedTeamDetails } from "../../domain/scheduling/medTeam.js";
import type { Roster } from "../../domain/scheduling/roster.js";

/** Port: med teams and their two-week rosters. */
export interface MedTeamRepository {
  /** By name. */
  list(): Promise<MedTeam[]>;
  findById(id: string): Promise<MedTeam | null>;
  /** Case-insensitive. */
  findByName(name: string): Promise<MedTeam | null>;
  /** Throws TeamNameTaken on a duplicate name. */
  create(details: MedTeamDetails): Promise<MedTeam>;
  /** Throws TeamNameTaken on a duplicate name. */
  update(id: string, details: MedTeamDetails): Promise<void>;
  setActive(id: string, isActive: boolean): Promise<void>;

  /** Every team's roster for the period starting `periodStart`. */
  listRosters(periodStart: string): Promise<Roster[]>;
  /** Replaces a team's roster for its period; an empty member list removes it. */
  saveRoster(roster: Roster): Promise<void>;
}
