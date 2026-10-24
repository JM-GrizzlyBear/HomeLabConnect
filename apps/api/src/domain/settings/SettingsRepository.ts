import type { SystemSettings } from "./systemSettings.js";

export interface SettingsRecord {
  settings: SystemSettings;
  /** null until an admin first saves; the defaults apply until then. */
  updatedAt: Date | null;
  /** Full name of whoever saved last. */
  updatedBy: string | null;
}

/** Port: the one set of system settings. */
export interface SettingsRepository {
  /** Saved values merged over the defaults, so newer settings get their default. */
  get(): Promise<SettingsRecord>;
  save(settings: SystemSettings, actorId: string): Promise<void>;
}
