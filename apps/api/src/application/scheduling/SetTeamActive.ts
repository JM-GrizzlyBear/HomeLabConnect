import type { MedTeam } from "../../domain/scheduling/medTeam.js";
import { TeamNotFound } from "../../domain/scheduling/schedulingErrors.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";

export interface SetTeamActiveInput {
  id: string;
  isActive: boolean;
}

/** Retires a team, or brings it back. Its past rosters are kept. */
export class SetTeamActive {
  constructor(private readonly teams: MedTeamRepository) {}

  async execute({ id, isActive }: SetTeamActiveInput): Promise<MedTeam> {
    const team = await this.teams.findById(id);
    if (!team) throw new TeamNotFound();
    if (team.isActive !== isActive) await this.teams.setActive(id, isActive);
    return { ...team, isActive };
  }
}
