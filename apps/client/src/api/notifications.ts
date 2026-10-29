import { type NotificationPage, notificationPageSchema } from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export async function fetchNotifications(
  filters: { page: number; pageSize: number; unread: boolean },
  signal?: AbortSignal,
): Promise<NotificationPage> {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
    unread: String(filters.unread),
  });
  return notificationPageSchema.parse(await apiRequest(`/notifications?${params}`, { signal }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest("/notifications/read-all", { method: "POST" });
}
