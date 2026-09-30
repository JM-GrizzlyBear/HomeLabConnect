import { existsSync } from "node:fs";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.url().default("http://localhost:5173"),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
  SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(720),
  SMTP_HOST: z.string().min(1).default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_FROM: z.string().min(1).default("HomeLabConnect <no-reply@homelabconnect.local>"),
});

export interface Config {
  env: "development" | "test" | "production";
  port: number;
  appUrl: string;
  databaseUrl: string;
  jwtSecret: string;
  sessionTtlMinutes: number;
  smtpHost: string;
  smtpPort: number;
  mailFrom: string;
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
    jwtSecret: parsed.data.JWT_SECRET,
    sessionTtlMinutes: parsed.data.SESSION_TTL_MINUTES,
    smtpHost: parsed.data.SMTP_HOST,
    smtpPort: parsed.data.SMTP_PORT,
    mailFrom: parsed.data.MAIL_FROM,
  };
}
