import { asc, desc, eq } from "drizzle-orm";
import type { ClosedDayRepository } from "../../application/ports/closedDayRepository.js";
import type { ClosedDay, ClosedDayDetails } from "../../domain/settings/closedDay.js";
import type { Database } from "./client.js";
import { holidays } from "./schema/index.js";

const columns = {
  id: holidays.id,
  date: holidays.date,
  name: holidays.name,
  kind: holidays.kind,
  repeatsYearly: holidays.repeatsYearly,
};

export class DrizzleClosedDayRepository implements ClosedDayRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<ClosedDay[]> {
    return this.db
      .select(columns)
      .from(holidays)
      .orderBy(desc(holidays.repeatsYearly), asc(holidays.date));
  }

  async findById(id: string): Promise<ClosedDay | null> {
    const [row] = await this.db.select(columns).from(holidays).where(eq(holidays.id, id));
    return row ?? null;
  }

  async create(details: ClosedDayDetails, actorId: string): Promise<ClosedDay> {
    const [row] = await this.db
      .insert(holidays)
      .values({ ...details, createdBy: actorId })
      .returning(columns);
    if (!row) throw new Error("Insert into holidays returned no row.");
    return row;
  }

  async update(id: string, details: ClosedDayDetails): Promise<void> {
    await this.db.update(holidays).set(details).where(eq(holidays.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(holidays).where(eq(holidays.id, id));
  }
}
