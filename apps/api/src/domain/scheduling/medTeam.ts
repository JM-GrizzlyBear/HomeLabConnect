import { InvalidTeam } from "./schedulingErrors.js";

/** What an admin fills in for a team. */
export interface MedTeamDetails {
  name: string;
  /** Where the team usually works, e.g. "Makati, Taguig". */
  area: string | null;
}

/** A med team that goes out on home visits. Deactivated, never deleted. */
export interface MedTeam extends MedTeamDetails {
  id: string;
  isActive: boolean;
}

/** Trims the name and area; a team needs a name. */
export function checkTeamDetails(input: MedTeamDetails): MedTeamDetails {
  const details = { name: input.name.trim(), area: input.area?.trim() || null };
  if (!details.name) throw new InvalidTeam("A team needs a name.");
  return details;
}
