import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

// Load the monorepo-root .env (run drizzle-kit from apps/api).
config({ path: resolve(process.cwd(), "../../.env") });

/**
 * Drizzle Kit config — used by `pnpm db:generate` to produce SQL
 * migrations from the schema in src/infrastructure/db/schema.ts.
 */
export default defineConfig({
  schema: "./src/infrastructure/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://homelabconnect:homelabconnectpass@localhost:5433/homelabconnect",
  },
  verbose: true,
  strict: true,
});
