import type { BaseRole } from "../../domain/identity/baseRole.js";
import { BcryptPasswordHasher } from "../auth/bcryptPasswordHasher.js";
import { loadConfig } from "../config.js";
import { createDatabase } from "./client.js";
import { employees, patients, roles, users } from "./schema/index.js";
import { syncPermissionCatalog } from "./seedPermissions.js";

// Seed data is added module by module (admin account, roles, permissions, ...).
// Safe to run repeatedly: existing rows are left untouched.
const SEED_PASSWORD = "Password123";
const EMAIL_DOMAIN = "homelabconnect.local";

const baseRoles: { id: BaseRole; name: string }[] = [
  { id: "patient", name: "Patient" },
  { id: "med_team", name: "Med Team" },
  { id: "doctor", name: "Doctor" },
  { id: "support", name: "Support" },
  { id: "admin", name: "Admin" },
];

interface SeedAccount {
  local: string;
  role: BaseRole;
  firstName: string;
  lastName: string;
  phone: string;
}

const staff: SeedAccount[] = [
  { local: "admin", role: "admin", firstName: "System", lastName: "Admin", phone: "09170000001" },
  { local: "doctor", role: "doctor", firstName: "Maria", lastName: "Santos", phone: "09170000002" },
  {
    local: "medteam",
    role: "med_team",
    firstName: "Juan",
    lastName: "Dela Cruz",
    phone: "09170000003",
  },
  { local: "support", role: "support", firstName: "Ana", lastName: "Reyes", phone: "09170000004" },
];

const patientAccounts: SeedAccount[] = Array.from({ length: 20 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    local: `patient${n}`,
    role: "patient",
    firstName: "Patient",
    lastName: n,
    phone: `091800000${n}`,
  };
});

const config = loadConfig();
const { db, pool } = createDatabase(config.databaseUrl);

try {
  await db.insert(roles).values(baseRoles).onConflictDoNothing();
  const permissionCount = await syncPermissionCatalog(db);

  const passwordHash = await new BcryptPasswordHasher().hash(SEED_PASSWORD);
  let created = 0;

  for (const account of [...staff, ...patientAccounts]) {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: `${account.local}@${EMAIL_DOMAIN}`,
          passwordHash,
          roleId: account.role,
          firstName: account.firstName,
          lastName: account.lastName,
          phone: account.phone,
        })
        .onConflictDoNothing({ target: users.email })
        .returning({ id: users.id });
      if (!user) return;

      created++;
      if (account.role === "patient") {
        await tx.insert(patients).values({ userId: user.id, address: "Makati City, Metro Manila" });
      } else {
        await tx.insert(employees).values({ userId: user.id });
      }
    });
  }

  console.log(
    `Seeded ${baseRoles.length} roles, ${permissionCount} permissions and ${created} new accounts (password: ${SEED_PASSWORD}).`,
  );
} finally {
  await pool.end();
}
