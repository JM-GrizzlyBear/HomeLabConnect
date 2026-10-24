import {
  checkTeamDetails,
  type MedTeam,
  type MedTeamDetails,
} from "../../domain/scheduling/medTeam.js";
import { TeamNameTaken } from "../../domain/scheduling/schedulingErrors.js";
import type { MedTeamRepository } from "../ports/medTeamRepository.js";

/** An admin adds a med team. Its members are set per period with a roster. */
export class CreateTeam {
  constructor(private readonly teams: MedTeamRepository) {}

  async execute(input: MedTeamDetails): Promise<MedTeam> {
    const details = checkTeamDetails(input);
    if (await this.teams.findByName(details.name)) throw new TeamNameTaken();
    return this.teams.create(details);
  }
}
