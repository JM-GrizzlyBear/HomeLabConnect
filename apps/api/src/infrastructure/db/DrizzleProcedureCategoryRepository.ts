import { asc, count, eq, sql } from "drizzle-orm";
import type {
  ProcedureCategoryRecord,
  ProcedureCategoryRepository,
} from "../../application/ports/procedureCategoryRepository.js";
import { CategoryNameTaken } from "../../domain/catalog/catalogErrors.js";
import type { ProcedureCategory } from "../../domain/catalog/procedureCategory.js";
import type { Database } from "./client.js";
import { isUniqueViolation } from "./errors.js";
import { labProcedures, procedureCategories } from "./schema/index.js";

export class DrizzleProcedureCategoryRepository implements ProcedureCategoryRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<ProcedureCategoryRecord[]> {
    return this.selectWithCount().orderBy(asc(procedureCategories.name));
  }

  async findById(id: string): Promise<ProcedureCategoryRecord | null> {
    const [row] = await this.selectWithCount().where(eq(procedureCategories.id, id));
    return row ?? null;
  }

  async findByName(name: string): Promise<ProcedureCategory | null> {
    const [row] = await this.db
      .select({ id: procedureCategories.id, name: procedureCategories.name })
      .from(procedureCategories)
      .where(eq(sql`lower(${procedureCategories.name})`, name.trim().toLowerCase()));
    return row ?? null;
  }

  async create(name: string): Promise<ProcedureCategoryRecord> {
    const [row] = await this.write(() =>
      this.db
        .insert(procedureCategories)
        .values({ name })
        .returning({ id: procedureCategories.id, name: procedureCategories.name }),
    );
    if (!row) throw new Error("Insert into procedure_categories returned no row.");
    return { ...row, procedureCount: 0 };
  }

  async rename(id: string, name: string): Promise<void> {
    await this.write(() =>
      this.db.update(procedureCategories).set({ name }).where(eq(procedureCategories.id, id)),
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(procedureCategories).where(eq(procedureCategories.id, id));
  }

  private selectWithCount() {
    return this.db
      .select({
        id: procedureCategories.id,
        name: procedureCategories.name,
        procedureCount: count(labProcedures.id),
      })
      .from(procedureCategories)
      .leftJoin(labProcedures, eq(labProcedures.categoryId, procedureCategories.id))
      .groupBy(procedureCategories.id)
      .$dynamic();
  }

  private async write<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (isUniqueViolation(error)) throw new CategoryNameTaken();
      throw error;
    }
  }
}
