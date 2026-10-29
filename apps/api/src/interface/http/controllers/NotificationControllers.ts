import { notificationIdParamsSchema, notificationQuerySchema } from "@homelabconnect/shared";
import type {
  ListNotifications,
  MarkAllNotificationsRead,
  MarkNotificationRead,
} from "../../../application/notifications/MyNotifications.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentNotifications } from "../presenters/notificationPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** Everyone sees only their own notifications. */
export class ListNotificationsController implements Controller {
  constructor(private readonly listNotifications: ListNotifications) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { page, pageSize, unread } = parseRequest(notificationQuerySchema, request.query);
    const result = await this.listNotifications.execute(requireAuth(request).userId, {
      page,
      pageSize,
      unreadOnly: unread === "true",
    });
    return presentNotifications(result, page, pageSize);
  }
}

export class MarkNotificationReadController implements Controller {
  constructor(private readonly markNotificationRead: MarkNotificationRead) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(notificationIdParamsSchema, request.params);
    await this.markNotificationRead.execute(id, requireAuth(request).userId);
    return { status: 204, body: undefined };
  }
}

export class MarkAllNotificationsReadController implements Controller {
  constructor(private readonly markAllNotificationsRead: MarkAllNotificationsRead) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    await this.markAllNotificationsRead.execute(requireAuth(request).userId);
    return { status: 204, body: undefined };
  }
}
