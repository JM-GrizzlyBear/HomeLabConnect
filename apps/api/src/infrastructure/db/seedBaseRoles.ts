import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { Database } from "./client.js";
import { roles } from "./schema/index.js";

export const baseRoles: { id: BaseRole; name: string }[] = [
  { id: "patient", name: "Patient" },
  { id: "med_team", name: "Med Team" },
  { id: "doctor", name: "Doctor" },
  { id: "support", name: "Support" },
  { id: "admin", name: "Admin" },
];

/** The five fixed base roles every user and custom role points at. Safe to run repeatedly. */
export async function seedBaseRoles(db: Database): Promise<number> {
  await db.insert(roles).values(baseRoles).onConflictDoNothing();
  return baseRoles.length;
}
