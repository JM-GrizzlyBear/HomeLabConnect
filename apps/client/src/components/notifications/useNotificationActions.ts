import type { NotificationView } from "@homelabconnect/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { markAllNotificationsRead, markNotificationRead } from "../../api/notifications";

/**
 * Opening a notification marks it read and goes to its page; "mark all read" clears the lot.
 * Either way the bell and the list refresh. Marking read is a nicety, so a failure is ignored.
 */
export function useNotificationActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["notifications"] });

  async function open(notification: NotificationView) {
    if (notification.readAt === null) {
      try {
        await markNotificationRead(notification.id);
      } catch {
        // It stays unread; the page still opens
      }
      refresh();
    }
    void navigate(notification.link);
  }

  async function markAll() {
    try {
      await markAllNotificationsRead();
    } catch {
      // Nothing to undo; the badge stays as it was
    }
    refresh();
  }

  return { open, markAll };
}
