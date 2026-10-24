import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import type {
  PromotionRecord,
  PromotionRepository,
} from "../../domain/catalog/PromotionRepository.js";
import { PromotionNameTaken } from "../../domain/catalog/catalogErrors.js";
import type { Promotion, PromotionDetails } from "../../domain/catalog/promotion.js";
import type { Database } from "./client.js";
import { isUniqueViolation } from "./errors.js";
import { promotionProcedures, promotions } from "./schema/index.js";

type PromotionRow = typeof promotions.$inferSelect;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

function toRecord(row: PromotionRow, procedureIds: string[]): PromotionRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    discountType: row.discountType,
    value: row.value,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    appliesTo: row.appliesTo,
    procedureIds,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toColumns(details: PromotionDetails) {
  return {
    name: details.name,
    description: details.description,
    discountType: details.discountType,
    value: details.value,
    startsOn: details.startsOn,
    endsOn: details.endsOn,
    appliesTo: details.appliesTo,
  };
}

export class DrizzlePromotionRepository implements PromotionRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<PromotionRecord[]> {
    const rows = await this.db
      .select()
      .from(promotions)
      .orderBy(desc(promotions.startsOn), promotions.name);
    return this.withProcedures(rows);
  }

  async listRunningOn(date: string): Promise<Promotion[]> {
    const rows = await this.db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.isActive, true),
          lte(promotions.startsOn, date),
          or(isNull(promotions.endsOn), gte(promotions.endsOn, date)),
        ),
      );
    return this.withProcedures(rows);
  }

  async findById(id: string): Promise<PromotionRecord | null> {
    const rows = await this.db.select().from(promotions).where(eq(promotions.id, id));
    const [promotion] = await this.withProcedures(rows);
    return promotion ?? null;
  }

  async findByName(name: string): Promise<Promotion | null> {
    const [row] = await this.db
      .select()
      .from(promotions)
      .where(eq(sql`lower(${promotions.name})`, name.trim().toLowerCase()));
    return row ? toRecord(row, []) : null;
  }

  async create(details: PromotionDetails): Promise<PromotionRecord> {
    const id = await this.write(async (tx) => {
      const [row] = await tx
        .insert(promotions)
        .values(toColumns(details))
        .returning({ id: promotions.id });
      if (!row) throw new Error("Insert into promotions returned no row.");
      await this.replaceProcedures(tx, row.id, details.procedureIds);
      return row.id;
    });
    const created = await this.findById(id);
    if (!created) throw new Error(`Promotion ${id} vanished after insert.`);
    return created;
  }

  async update(id: string, details: PromotionDetails): Promise<void> {
    await this.write(async (tx) => {
      await tx.update(promotions).set(toColumns(details)).where(eq(promotions.id, id));
      await this.replaceProcedures(tx, id, details.procedureIds);
    });
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.db.update(promotions).set({ isActive }).where(eq(promotions.id, id));
  }

  /** Runs a write in a transaction, turning a duplicate name into PromotionNameTaken. */
  private async write<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    try {
      return await this.db.transaction(work);
    } catch (error) {
      if (isUniqueViolation(error)) throw new PromotionNameTaken();
      throw error;
    }
  }

  private async replaceProcedures(tx: Transaction, promotionId: string, procedureIds: string[]) {
    await tx.delete(promotionProcedures).where(eq(promotionProcedures.promotionId, promotionId));
    if (procedureIds.length === 0) return;
    await tx
      .insert(promotionProcedures)
      .values(procedureIds.map((procedureId) => ({ promotionId, procedureId })));
  }

  /** Adds each promotion's procedure ids, in one query. */
  private async withProcedures(rows: PromotionRow[]): Promise<PromotionRecord[]> {
    if (rows.length === 0) return [];
    const links = await this.db
      .select()
      .from(promotionProcedures)
      .where(
        inArray(
          promotionProcedures.promotionId,
          rows.map((row) => row.id),
        ),
      );
    return rows.map((row) =>
      toRecord(
        row,
        links.filter((link) => link.promotionId === row.id).map((link) => link.procedureId),
      ),
    );
  }
}
