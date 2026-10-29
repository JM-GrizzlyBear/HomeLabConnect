import { z } from "zod";

export const notificationSchema = z.object({
  id: z.uuid(),
  /** e.g. "confirmed", "booking_pending". */
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  /** An in-app path, e.g. /app/appointments/<id>. */
  link: z.string(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const notificationPageSchema = z.object({
  items: z.array(notificationSchema),
  total: z.number().int(),
  /** Unread, of all of them (not just this page). */
  unread: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  unread: z.enum(["true", "false"]).default("false"),
});

export const notificationIdParamsSchema = z.object({ id: z.uuid("Not a valid id.") });

export type NotificationView = z.infer<typeof notificationSchema>;
export type NotificationPage = z.infer<typeof notificationPageSchema>;
