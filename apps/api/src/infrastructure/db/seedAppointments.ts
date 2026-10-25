import { asc, eq, inArray } from "drizzle-orm";
import { addDays, businessDate } from "../../domain/time/businessDate.js";
import type { Database } from "./client.js";
import {
  appointmentEvents,
  appointmentProcedures,
  appointments,
  labProcedures,
  medTeams,
  users,
} from "./schema/index.js";

type SeedStatus = "pending" | "confirmed" | "rejected";

/** [patient email prefix, days from today, slot, status, how many tests]. */
const samples: [string, number, string, SeedStatus, number][] = [
  ["patient01", 2, "07:00", "pending", 2],
  ["patient02", 3, "08:00", "confirmed", 1],
  ["patient03", 4, "06:00", "rejected", 3],
  ["patient01", 5, "09:00", "pending", 1],
];

/**
 * A few sample bookings for the first patients, starting two days from now, so the
 * appointment pages have something to show. Only runs on a database with no appointments.
 */
export async function seedAppointments(
  db: Database,
  emailDomain: string,
  now = new Date(),
): Promise<number> {
  const [existing] = await db.select({ id: appointments.id }).from(appointments).limit(1);
  if (existing) return 0;

  const tests = await db
    .select()
    .from(labProcedures)
    .where(eq(labProcedures.isActive, true))
    .orderBy(asc(labProcedures.code))
    .limit(3);
  const patients = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(
      inArray(
        users.email,
        samples.map(([local]) => `${local}@${emailDomain}`),
      ),
    );
  if (tests.length === 0 || patients.length === 0) return 0;
  // The confirmed sample goes to Team Makati, so the med team sees it under My Visits
  const [makati] = await db
    .select({ id: medTeams.id })
    .from(medTeams)
    .where(eq(medTeams.name, "Team Makati"));

  const today = businessDate(now);
  let added = 0;
  for (const [local, daysAhead, slot, status, testCount] of samples) {
    const patient = patients.find((candidate) => candidate.email === `${local}@${emailDomain}`);
    if (!patient) continue;
    const chosen = tests.slice(0, testCount);
    const subtotal = chosen.reduce((sum, test) => sum + test.priceCentavos, 0);

    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(appointments)
        .values({
          patientUserId: patient.id,
          visitDate: addDays(today, daysAhead),
          slotStart: slot,
          status,
          address: "Makati City, Metro Manila",
          landmark: null,
          patientNotes: null,
          subtotalCentavos: subtotal,
          discountCentavos: 0,
          totalCentavos: subtotal,
          decisionNote: status === "rejected" ? "No team can reach that area yet." : null,
          teamId: status === "confirmed" ? (makati?.id ?? null) : null,
        })
        .returning({ id: appointments.id });
      if (!row) return;
      await tx.insert(appointmentProcedures).values(
        chosen.map((test, position) => ({
          appointmentId: row.id,
          procedureId: test.id,
          position,
          code: test.code,
          name: test.name,
          priceCentavos: test.priceCentavos,
          discountCentavos: 0,
        })),
      );
      await tx
        .insert(appointmentEvents)
        .values([
          { appointmentId: row.id, actorId: patient.id, kind: "booked" },
          ...(status === "pending" ? [] : [{ appointmentId: row.id, actorId: null, kind: status }]),
        ]);
    });
    added++;
  }
  return added;
}
