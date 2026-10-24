import { sql } from "drizzle-orm";
import type { DatabaseHealthProbe } from "../../application/ports/DatabaseHealthProbe.js";
import type { Database } from "./client.js";

export class DrizzleDatabaseHealthProbe implements DatabaseHealthProbe {
  constructor(private readonly db: Database) {}

  async isReachable(): Promise<boolean> {
    try {
      await this.db.execute(sql`select 1`);
      return true;
    } catch {
      return false;
    }
  }
}
