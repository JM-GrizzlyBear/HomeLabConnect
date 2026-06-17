import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { resolve } from "node:path";
import { env } from "../../env";

async function main() {
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
  await sql.end();
  console.log("✅ migrations applied");
}

main().catch((err) => {
  console.error("❌ migration failed", err);
  process.exit(1);
});
