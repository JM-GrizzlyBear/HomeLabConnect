import type { NotificationPage as NotificationPageView } from "@homelabconnect/shared";
import type { NotificationPage } from "../../../domain/notifications/NotificationRepository.js";
import type { HttpResponse } from "../httpTypes.js";

export function presentNotifications(
  result: NotificationPage,
  page: number,
  pageSize: number,
): HttpResponse<NotificationPageView> {
  return {
    status: 200,
    body: {
      items: result.items.map((notification) => ({
        id: notification.id,
        kind: notification.kind,
        title: notification.title,
        body: notification.body,
        link: notification.link,
        readAt: notification.readAt?.toISOString() ?? null,
        createdAt: notification.createdAt.toISOString(),
      })),
      total: result.total,
      unread: result.unread,
      page,
      pageSize,
    },
  };
}
