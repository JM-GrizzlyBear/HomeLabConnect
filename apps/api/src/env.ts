import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

config({ path: resolve(process.cwd(), "../../.env") });

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3001"),
});

export const env = EnvSchema.parse(process.env);
export type Env = typeof env;
