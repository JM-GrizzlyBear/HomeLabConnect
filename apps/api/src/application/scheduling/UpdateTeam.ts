import {
  checkTeamDetails,
  type MedTeam,
  type MedTeamDetails,
} from "../../domain/scheduling/medTeam.js";
import { TeamNameTaken, TeamNotFound } from "../../domain/scheduling/schedulingErrors.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";

export interface UpdateTeamInput extends MedTeamDetails {
  id: string;
}

/** Renames a team or changes its area. */
export class UpdateTeam {
  constructor(private readonly teams: MedTeamRepository) {}

  async execute({ id, ...input }: UpdateTeamInput): Promise<MedTeam> {
    const team = await this.teams.findById(id);
    if (!team) throw new TeamNotFound();
    const details = checkTeamDetails(input);
    const sameName = await this.teams.findByName(details.name);
    if (sameName && sameName.id !== id) throw new TeamNameTaken();
    await this.teams.update(id, details);
    return { ...team, ...details };
  }
}
