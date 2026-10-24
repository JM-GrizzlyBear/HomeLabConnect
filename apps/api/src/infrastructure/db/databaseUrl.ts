import { existsSync } from "node:fs";

/**
 * DATABASE_URL, from the environment or the repo-root .env. For scripts that only need the
 * database (migrate, seed), so they also run where the API's other settings aren't set.
 */
export function readDatabaseUrl(): string {
  const envFile = new URL("../../../../../.env", import.meta.url);
  if (!process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);

  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");
  return url;
}
