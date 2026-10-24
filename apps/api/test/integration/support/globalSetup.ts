import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { createDatabase } from "../../../src/infrastructure/db/client.js";
import { seedBaseRoles } from "../../../src/infrastructure/db/seedBaseRoles.js";
import { syncPermissionCatalog } from "../../../src/infrastructure/db/seedPermissions.js";
import { testDatabaseUrl } from "./testDatabase.js";

const migrationsFolder = fileURLToPath(new URL("../../../drizzle", import.meta.url));

// Runs once before the integration tests: creates the test database if it doesn't exist,
// applies every migration exactly like production, then adds the fixed catalogue
// (base roles and permissions) that the per-test reset keeps.
export default async function setup(): Promise<void> {
  const url = testDatabaseUrl();
  await createDatabaseIfMissing(url);

  const { db, pool } = createDatabase(url);
  try {
    await migrate(db, { migrationsFolder });
    await seedBaseRoles(db);
    await syncPermissionCatalog(db);
  } finally {
    await pool.end();
  }
}

async function createDatabaseIfMissing(url: string): Promise<void> {
  const name = new URL(url).pathname.slice(1);
  const admin = new URL(url);
  admin.pathname = "/postgres";
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const found = await client.query("select 1 from pg_database where datname = $1", [name]);
    if (found.rowCount === 0) await client.query(`create database "${name.replaceAll('"', "")}"`);
  } finally {
    await client.end();
  }
}
