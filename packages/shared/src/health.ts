import { z } from "zod";

export const componentStatusSchema = z.enum(["ok", "down"]);

export const healthResponseSchema = z.object({
  status: componentStatusSchema,
  db: componentStatusSchema,
});

export type ComponentStatus = z.infer<typeof componentStatusSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
