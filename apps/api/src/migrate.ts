// Applies new migrations (apps/api/drizzle) before the API starts. The Docker image runs
// `node dist/migrate.js && node dist/main.js`, so drizzle-kit isn't needed in production.
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase } from "./infrastructure/db/client.js";
import { readDatabaseUrl } from "./infrastructure/db/databaseUrl.js";

const { db, pool } = createDatabase(readDatabaseUrl());
try {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  console.log("Migrations are up to date.");
} finally {
  await pool.end();
}
