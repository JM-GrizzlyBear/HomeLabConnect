import { inArray } from "drizzle-orm";
import { addDays, businessDate } from "../../domain/time/businessDate.js";
import type { Database } from "./client.js";
import { labProcedures, promotionProcedures, promotions } from "./schema/index.js";

/**
 * Two sample promotions, dated from the day the seed runs: a standing
 * senior/PWD discount with no end date, and one next month on diabetes tests. Existing promotions
 * (matched by name) are left alone. Returns how many were added.
 */
export async function seedPromotions(db: Database, now = new Date()): Promise<number> {
  const today = businessDate(now);
  const diabetesTests = await db
    .select({ id: labProcedures.id })
    .from(labProcedures)
    .where(inArray(labProcedures.code, ["FBS", "HBA1C"]));

  const seeds = [
    {
      promotion: {
        name: "Senior & PWD Discount",
        description: "20% off every test for seniors and persons with disability. No end date.",
        discountType: "percent" as const,
        value: 20,
        startsOn: today,
        endsOn: null,
        appliesTo: "all" as const,
      },
      procedureIds: [],
    },
    {
      promotion: {
        name: "Diabetes Check",
        description: "₱200 off blood sugar and HbA1c tests.",
        discountType: "fixed" as const,
        value: 20_000,
        startsOn: addDays(today, 30),
        endsOn: addDays(today, 60),
        appliesTo: "selected" as const,
      },
      procedureIds: diabetesTests.map((procedure) => procedure.id),
    },
  ];

  let added = 0;
  for (const seed of seeds) {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(promotions)
        .values(seed.promotion)
        .onConflictDoNothing()
        .returning({ id: promotions.id });
      if (!row) return;
      added++;
      if (seed.procedureIds.length > 0) {
        await tx
          .insert(promotionProcedures)
          .values(seed.procedureIds.map((procedureId) => ({ promotionId: row.id, procedureId })));
      }
    });
  }
  return added;
}
