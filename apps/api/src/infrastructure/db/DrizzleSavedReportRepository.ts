import { and, asc, eq } from "drizzle-orm";
import { SavedReportNameTaken } from "../../domain/reports/reportErrors.js";
import type {
  NewSavedReport,
  SavedReport,
  SavedReportRepository,
} from "../../domain/reports/SavedReportRepository.js";
import type { Database } from "./client.js";
import { isUniqueViolation } from "./errors.js";
import { savedReports } from "./schema/index.js";

export class DrizzleSavedReportRepository implements SavedReportRepository {
  constructor(private readonly db: Database) {}

  async list(userId: string): Promise<SavedReport[]> {
    return await this.db
      .select()
      .from(savedReports)
      .where(eq(savedReports.userId, userId))
      .orderBy(asc(savedReports.name));
  }

  async create(report: NewSavedReport): Promise<SavedReport> {
    try {
      const [row] = await this.db.insert(savedReports).values(report).returning();
      if (!row) throw new Error("Insert into saved_reports returned no row.");
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) throw new SavedReportNameTaken(report.name);
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(savedReports)
      .where(and(eq(savedReports.id, id), eq(savedReports.userId, userId)))
      .returning({ id: savedReports.id });
    return deleted.length > 0;
  }
}
