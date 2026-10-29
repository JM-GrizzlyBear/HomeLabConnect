import { NotificationNotFound } from "../../domain/notifications/notificationErrors.js";
import type {
  NotificationPage,
  NotificationRepository,
} from "../../domain/notifications/NotificationRepository.js";
import type { Clock } from "../ports/Clock.js";

/** The signed-in person's notifications, newest first, with how many are unread. */
export class ListNotifications {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(
    userId: string,
    page: { page: number; pageSize: number; unreadOnly: boolean },
  ): Promise<NotificationPage> {
    return await this.notifications.list(userId, page);
  }
}

/** Marks one of their own as read (anyone else's answers 404). */
export class MarkNotificationRead {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    if (!(await this.notifications.markRead(id, userId, this.clock.now()))) {
      throw new NotificationNotFound();
    }
  }
}

export class MarkAllNotificationsRead {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.notifications.markAllRead(userId, this.clock.now());
  }
}
