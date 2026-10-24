import type {
  SettingsRecord,
  SettingsRepository,
} from "../../domain/settings/SettingsRepository.js";

export class GetSystemSettings {
  constructor(private readonly settings: SettingsRepository) {}

  async execute(): Promise<SettingsRecord> {
    return this.settings.get();
  }
}
