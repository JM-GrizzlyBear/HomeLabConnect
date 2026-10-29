import type { Notice, Notification } from "./notification.js";

export interface NotificationPage {
  items: Notification[];
  total: number;
  unread: number;
}

/** Port: each person's notifications. */
export interface NotificationRepository {
  /** One row per person, all at `at`; returns them by user. */
  add(userIds: readonly string[], notice: Notice, at: Date): Promise<Notification[]>;
  /** Newest first; only unread ones when `unreadOnly`. */
  list(
    userId: string,
    page: { page: number; pageSize: number; unreadOnly: boolean },
  ): Promise<NotificationPage>;
  /** False when it isn't theirs (or doesn't exist). */
  markRead(id: string, userId: string, at: Date): Promise<boolean>;
  markAllRead(userId: string, at: Date): Promise<void>;
}
