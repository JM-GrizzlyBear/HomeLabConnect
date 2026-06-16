import { z } from "zod";
import { isoDateTime, uuid } from "./primitives";

// Server-side only — usually NOT returned to clients.
// token_hash intentionally omitted from public DTO.
export const SessionSchema = z.object({
  id: uuid,
  userId: uuid,
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  expiresAt: isoDateTime,
  revokedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
});
export type Session = z.infer<typeof SessionSchema>;
