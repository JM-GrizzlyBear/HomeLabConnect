import { ClosedDayNotFound } from "../../domain/settings/settingsErrors.js";
import type { ClosedDayRepository } from "../ports/closedDayRepository.js";

export interface RemoveClosedDayInput {
  id: string;
}

/** Opens a closed day again for booking. */
export class RemoveClosedDay {
  constructor(private readonly closedDays: ClosedDayRepository) {}

  async execute({ id }: RemoveClosedDayInput): Promise<void> {
    if (!(await this.closedDays.findById(id))) throw new ClosedDayNotFound();
    await this.closedDays.delete(id);
  }
}
