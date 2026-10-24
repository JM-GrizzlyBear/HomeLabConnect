import { eq } from "drizzle-orm";
import type {
  SettingsRecord,
  SettingsRepository,
} from "../../domain/settings/SettingsRepository.js";
import { DEFAULT_SETTINGS, type SystemSettings } from "../../domain/settings/systemSettings.js";
import type { Database } from "./client.js";
import { systemSettings, users } from "./schema/index.js";

const ROW_ID = 1;

export class DrizzleSettingsRepository implements SettingsRepository {
  constructor(private readonly db: Database) {}

  async get(): Promise<SettingsRecord> {
    const [row] = await this.db
      .select({
        data: systemSettings.data,
        updatedAt: systemSettings.updatedAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(systemSettings)
      .leftJoin(users, eq(users.id, systemSettings.updatedBy))
      .where(eq(systemSettings.id, ROW_ID));
    if (!row) return { settings: DEFAULT_SETTINGS, updatedAt: null, updatedBy: null };
    return {
      settings: { ...DEFAULT_SETTINGS, ...row.data },
      updatedAt: row.updatedAt,
      updatedBy: row.firstName ? `${row.firstName} ${row.lastName ?? ""}`.trim() : null,
    };
  }

  async save(settings: SystemSettings, actorId: string): Promise<void> {
    const values = { data: settings, updatedBy: actorId, updatedAt: new Date() };
    await this.db
      .insert(systemSettings)
      .values({ id: ROW_ID, ...values })
      .onConflictDoUpdate({ target: systemSettings.id, set: values });
  }
}
