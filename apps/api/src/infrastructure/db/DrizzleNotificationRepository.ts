import { and, count, desc, eq, isNull, type SQL } from "drizzle-orm";
import type {
  Notice,
  Notification,
  NotificationKind,
} from "../../domain/notifications/notification.js";
import type {
  NotificationPage,
  NotificationRepository,
} from "../../domain/notifications/NotificationRepository.js";
import type { Database } from "./client.js";
import { notifications } from "./schema/index.js";

type Row = typeof notifications.$inferSelect;
const toNotification = (row: Row): Notification => ({
  ...row,
  kind: row.kind as NotificationKind,
});

export class DrizzleNotificationRepository implements NotificationRepository {
  constructor(private readonly db: Database) {}

  async add(userIds: readonly string[], notice: Notice, at: Date): Promise<Notification[]> {
    if (userIds.length === 0) return [];
    const rows = await this.db
      .insert(notifications)
      .values(userIds.map((userId) => ({ ...notice, userId, createdAt: at })))
      .returning();
    return rows.map(toNotification);
  }

  async list(
    userId: string,
    { page, pageSize, unreadOnly }: { page: number; pageSize: number; unreadOnly: boolean },
  ): Promise<NotificationPage> {
    const mine = eq(notifications.userId, userId);
    const unread = and(mine, isNull(notifications.readAt));
    const where: SQL | undefined = unreadOnly ? unread : mine;
    const [rows, [totals], [unreadTotals]] = await Promise.all([
      this.db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt), desc(notifications.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db.select({ value: count() }).from(notifications).where(where),
      this.db.select({ value: count() }).from(notifications).where(unread),
    ]);
    return {
      items: rows.map(toNotification),
      total: totals?.value ?? 0,
      unread: unreadTotals?.value ?? 0,
    };
  }

  async markRead(id: string, userId: string, at: Date): Promise<boolean> {
    const rows = await this.db
      .update(notifications)
      .set({ readAt: at })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });
    return rows.length > 0;
  }

  async markAllRead(userId: string, at: Date): Promise<void> {
    await this.db
      .update(notifications)
      .set({ readAt: at })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  }
}
