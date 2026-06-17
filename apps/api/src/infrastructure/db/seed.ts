import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../../.env") });

import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { roles, users } from "./schema.js";
import { SEED_ROLES } from "./seeds/role.seeds.js";
import { SEED_USERS } from "./seeds/user.seeds.js";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  console.log("Seeding roles 🃏…");
  await db
    .insert(roles)
    .values(
      SEED_ROLES.map((r) => ({ role: r.role, description: r.description })),
    )
    .onConflictDoUpdate({
      target: roles.role,
      set: {
        description: sql`excluded.description`,
        updatedAt: new Date(),
      },
    });

  console.log("Seeding users 👥…");
  await db
    .insert(users)
    .values(
      SEED_USERS.map((u) => ({
        email: u.email,
        passwordHash: bcrypt.hashSync(u.password, 10),
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        middleName: u.middleName,
        phone: u.phone,
        avatar: u.avatar,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
      })),
    )
    .onConflictDoNothing({ target: users.email });

  await client.end();
  console.log("✅ seed complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ seed failed", err);
  process.exit(1);
});
