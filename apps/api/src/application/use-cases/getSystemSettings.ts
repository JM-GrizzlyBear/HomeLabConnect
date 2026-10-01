import type { SettingsRecord, SettingsRepository } from "../ports/settingsRepository.js";

export class GetSystemSettings {
  constructor(private readonly settings: SettingsRepository) {}

  async execute(): Promise<SettingsRecord> {
    return this.settings.get();
  }
}
