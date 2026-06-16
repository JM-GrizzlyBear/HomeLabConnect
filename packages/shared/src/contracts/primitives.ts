import { z } from "zod";

export const uuid = z.string().uuid();
export const isoDateTime = z.string(); // ISO 8601 timestamp e.g. "2026-06-17T10:00:00Z"
export const isoDate = z.string(); // YYYY-MM-DD
export const timeOfDay = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "HH:MM or HH:MM:SS");
export const phone = z.string().min(4).max(40);
export const moneyMinor = z.number().int().nonnegative(); // integer minor units
export const permissionKey = z
  .string()
  .min(1)
  .max(120)
  .regex(
    /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/,
    "lowercase dot-notation e.g. 'chat.attachment.create'",
  );

export const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(jsonValue),
  ]),
);
