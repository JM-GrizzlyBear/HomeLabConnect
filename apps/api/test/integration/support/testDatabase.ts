import { existsSync } from "node:fs";

const envFile = new URL("../../../../../.env", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

// The test database: TEST_DATABASE_URL, or else DATABASE_URL with "_test" added to the
// database name (homelabconnect → homelabconnect_test). It's emptied before every test,
// so it must never be your real database.
export function testDatabaseUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL;
  if (explicit) return assertTestDatabase(explicit);

  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error(
      "Set TEST_DATABASE_URL (or DATABASE_URL in the root .env) to run the integration tests.",
    );
  }
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, "")}_test`;
  return assertTestDatabase(url.toString());
}

// Safety: refuse anything whose database name doesn't end with "_test"
function assertTestDatabase(value: string): string {
  const name = new URL(value).pathname.slice(1);
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests on "${name}": the test database's name must end with "_test".`,
    );
  }
  return value;
}
