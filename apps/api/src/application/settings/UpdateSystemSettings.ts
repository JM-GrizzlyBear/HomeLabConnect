import { checkSettings, type SystemSettings } from "../../domain/settings/systemSettings.js";
import type {
  SettingsRecord,
  SettingsRepository,
} from "../../domain/settings/SettingsRepository.js";

export interface UpdateSystemSettingsInput {
  actorId: string;
  settings: SystemSettings;
}

/** An admin changes the booking and assignment rules. Bookings use them from the next request. */
export class UpdateSystemSettings {
  constructor(private readonly settings: SettingsRepository) {}

  async execute({ actorId, settings }: UpdateSystemSettingsInput): Promise<SettingsRecord> {
    await this.settings.save(checkSettings(settings), actorId);
    return this.settings.get();
  }
}
