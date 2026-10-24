import { inArray, sql } from "drizzle-orm";
import { rosterPeriodOf, ROSTER_PERIOD_DAYS } from "../../domain/scheduling/roster.js";
import { addDays, businessDate } from "../../domain/time/businessDate.js";
import type { Database } from "./client.js";
import { medTeams, teamRosterMembers, teamRosters, users } from "./schema/index.js";

/**
 * Team Makati (lead Juan, with Paolo) for this period and the next, and an
 * empty Team Quezon City. Teams are matched by name and existing rosters are
 * left alone, so admins' changes survive a re-seed. Returns how many teams were added.
 */
export async function seedTeams(
  db: Database,
  emailDomain: string,
  now = new Date(),
): Promise<number> {
  const added = await db
    .insert(medTeams)
    .values([
      { name: "Team Makati", area: "Makati, Taguig" },
      { name: "Team Quezon City", area: "Quezon City" },
    ])
    .onConflictDoNothing()
    .returning({ id: medTeams.id });

  const [makati] = await db
    .select({ id: medTeams.id })
    .from(medTeams)
    .where(sql`lower(${medTeams.name}) = 'team makati'`);
  const people = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, [`medteam@${emailDomain}`, `seniormedtech@${emailDomain}`]));
  const juan = people.find((person) => person.email.startsWith("medteam@"));
  const paolo = people.find((person) => person.email.startsWith("seniormedtech@"));
  if (!makati || !juan || !paolo) return added.length;

  const thisPeriod = rosterPeriodOf(businessDate(now));
  for (const periodStart of [thisPeriod, addDays(thisPeriod, ROSTER_PERIOD_DAYS)]) {
    await db.transaction(async (tx) => {
      const [roster] = await tx
        .insert(teamRosters)
        .values({ teamId: makati.id, periodStart, leadUserId: juan.id })
        .onConflictDoNothing()
        .returning({ id: teamRosters.id });
      if (!roster) return;
      await tx.insert(teamRosterMembers).values([
        { rosterId: roster.id, userId: juan.id },
        { rosterId: roster.id, userId: paolo.id },
      ]);
    });
  }
  return added.length;
}
