import { and, asc, count, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import type {
  LabProcedureListPage,
  LabProcedureListQuery,
  LabProcedureRecord,
  LabProcedureRepository,
} from "../../application/ports/labProcedureRepository.js";
import { ProcedureCodeTaken, ProcedureNameTaken } from "../../domain/catalog/catalogErrors.js";
import type { LabProcedure, LabProcedureDetails } from "../../domain/catalog/labProcedure.js";
import type { Database } from "./client.js";
import { uniqueViolationConstraint } from "./errors.js";
import { likePattern } from "./likePattern.js";
import { labProcedures, procedureCategories } from "./schema/index.js";

type ProcedureRow = typeof labProcedures.$inferSelect;

function toProcedure(row: ProcedureRow): LabProcedure {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    categoryId: row.categoryId,
    priceCentavos: row.priceCentavos,
    specimen: row.specimen,
    turnaroundHours: row.turnaroundHours,
    fastingHours: row.fastingHours,
    preparation: row.preparation,
    description: row.description,
    isActive: row.isActive,
  };
}

function toRecord(row: {
  procedure: ProcedureRow;
  category: { id: string; name: string };
}): LabProcedureRecord {
  return {
    ...toProcedure(row.procedure),
    category: row.category,
    createdAt: row.procedure.createdAt,
    updatedAt: row.procedure.updatedAt,
  };
}

function listFilter({ search, categoryId, isActive }: LabProcedureListQuery): SQL | undefined {
  const pattern = search ? likePattern(search) : null;
  return and(
    pattern
      ? or(ilike(labProcedures.code, pattern), ilike(labProcedures.name, pattern))
      : undefined,
    categoryId ? eq(labProcedures.categoryId, categoryId) : undefined,
    isActive === null ? undefined : eq(labProcedures.isActive, isActive),
  );
}

export class DrizzleLabProcedureRepository implements LabProcedureRepository {
  constructor(private readonly db: Database) {}

  async list(query: LabProcedureListQuery): Promise<LabProcedureListPage> {
    const where = listFilter(query);
    const [rows, [totals]] = await Promise.all([
      this.selectWithCategory()
        .where(where)
        .orderBy(asc(procedureCategories.name), asc(labProcedures.name))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ total: count() }).from(labProcedures).where(where),
    ]);
    return { items: rows.map(toRecord), total: totals?.total ?? 0 };
  }

  async findById(id: string): Promise<LabProcedureRecord | null> {
    const [row] = await this.selectWithCategory().where(eq(labProcedures.id, id));
    return row ? toRecord(row) : null;
  }

  async findByCode(code: string): Promise<LabProcedure | null> {
    const [row] = await this.db.select().from(labProcedures).where(eq(labProcedures.code, code));
    return row ? toProcedure(row) : null;
  }

  async findByName(name: string): Promise<LabProcedure | null> {
    const [row] = await this.db
      .select()
      .from(labProcedures)
      .where(eq(sql`lower(${labProcedures.name})`, name.trim().toLowerCase()));
    return row ? toProcedure(row) : null;
  }

  async create(details: LabProcedureDetails): Promise<LabProcedureRecord> {
    const [row] = await this.write(() =>
      this.db.insert(labProcedures).values(details).returning({ id: labProcedures.id }),
    );
    if (!row) throw new Error("Insert into lab_procedures returned no row.");
    const created = await this.findById(row.id);
    if (!created) throw new Error(`Lab procedure ${row.id} vanished after insert.`);
    return created;
  }

  async update(id: string, details: LabProcedureDetails): Promise<void> {
    await this.write(() =>
      this.db.update(labProcedures).set(details).where(eq(labProcedures.id, id)),
    );
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.db.update(labProcedures).set({ isActive }).where(eq(labProcedures.id, id));
  }

  private selectWithCategory() {
    return this.db
      .select({
        procedure: labProcedures,
        category: { id: procedureCategories.id, name: procedureCategories.name },
      })
      .from(labProcedures)
      .innerJoin(procedureCategories, eq(procedureCategories.id, labProcedures.categoryId))
      .$dynamic();
  }

  /** Turns a unique violation that slipped past the use case's checks into the right error. */
  private async write<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      const constraint = uniqueViolationConstraint(error);
      if (constraint === "lab_procedures_code_unique") throw new ProcedureCodeTaken();
      if (constraint !== null) throw new ProcedureNameTaken();
      throw error;
    }
  }
}
