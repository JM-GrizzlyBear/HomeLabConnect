import { z } from "zod";
import { NotificationTypeSchema } from "./enums";
import { isoDateTime, jsonValue, uuid } from "./primitives";

export const NotificationSchema = z.object({
  id: uuid,
  userId: uuid,
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: jsonValue.nullable(),
  linkUrl: z.string().nullable(),
  isRead: z.boolean(),
  readAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
});
export type Notification = z.infer<typeof NotificationSchema>;

export const ListNotificationsInputSchema = z.object({
  isRead: z.boolean().optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});
export type ListNotificationsInput = z.infer<
  typeof ListNotificationsInputSchema
>;

export const MarkNotificationReadInputSchema = z.object({ id: uuid });
export type MarkNotificationReadInput = z.infer<
  typeof MarkNotificationReadInputSchema
>;
