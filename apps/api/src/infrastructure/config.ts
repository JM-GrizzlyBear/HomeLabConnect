import { existsSync } from "node:fs";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.url().default("http://localhost:5173"),
  DATABASE_URL: z.url(),
});

export interface Config {
  env: "development" | "test" | "production";
  port: number;
  appUrl: string;
  databaseUrl: string;
}

/** Reads the repo-root .env (if present) and validates every variable the API needs. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const envFile = new URL("../../../../.env", import.meta.url);
  if (env === process.env && existsSync(envFile)) process.loadEnvFile(envFile);

  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}\nSee .env.example.`);
  }

  return {
    env: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    appUrl: parsed.data.APP_URL,
    databaseUrl: parsed.data.DATABASE_URL,
  };
}
