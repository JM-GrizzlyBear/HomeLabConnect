import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/** "true"/"1" or "false"/"0"; unset uses the default. */
const flag = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.url().default("http://localhost:5173"),
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().min(32, "must be at least 32 characters (openssl rand -hex 32)"),
  SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(720),
  /** HTTPS-only session cookie. On by default in production. */
  COOKIE_SECURE: flag.optional(),
  /**
   * How many proxies sit in front of the API, so the client IP and HTTPS are read from
   * X-Forwarded-*: 0 locally, 2 on Render behind Netlify (Netlify's proxy, then Render's).
   */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  /** Where photos go: "local" (apps/api/uploads) or "cloudinary". */
  PHOTO_STORAGE: z.enum(["local", "cloudinary"]).default("local"),
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().min(1).default("homelabconnect"),
  SMTP_HOST: z.string().min(1).default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_FROM: z.string().min(1).default("HomeLabConnect <no-reply@homelabconnect.local>"),
});

export interface Config {
  env: "development" | "test" | "production";
  port: number;
  appUrl: string;
  databaseUrl: string;
  sessionSecret: string;
  sessionTtlMinutes: number;
  secureCookie: boolean;
  trustProxy: number;
  photoStorage: "local" | "cloudinary";
  cloudinaryUrl: string | undefined;
  cloudinaryFolder: string;
  uploadsDir: string;
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
    sessionSecret: parsed.data.SESSION_SECRET,
    sessionTtlMinutes: parsed.data.SESSION_TTL_MINUTES,
    secureCookie: parsed.data.COOKIE_SECURE ?? parsed.data.NODE_ENV === "production",
    trustProxy: parsed.data.TRUST_PROXY,
    photoStorage: parsed.data.PHOTO_STORAGE,
    cloudinaryUrl: parsed.data.CLOUDINARY_URL?.trim() || undefined,
    cloudinaryFolder: parsed.data.CLOUDINARY_FOLDER,
    uploadsDir: fileURLToPath(new URL("../../uploads", import.meta.url)),
    smtpHost: parsed.data.SMTP_HOST,
    smtpPort: parsed.data.SMTP_PORT,
    mailFrom: parsed.data.MAIL_FROM,
  };
}
