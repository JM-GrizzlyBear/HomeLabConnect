import { loadConfig } from "../config.js";
import { createDatabase } from "./client.js";

// Seed data is added module by module (admin account, roles, permissions, ...).
const config = loadConfig();
const { pool } = createDatabase(config.databaseUrl);

try {
  console.log("Nothing to seed yet.");
} finally {
  await pool.end();
}
