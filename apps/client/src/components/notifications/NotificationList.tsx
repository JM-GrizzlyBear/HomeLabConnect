import type { NotificationView } from "@homelabconnect/shared";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

/** Notifications, newest first; unread ones are bold with a dot. Picking one opens its page. */
export function NotificationList({
  items,
  onOpen,
  label,
}: {
  items: NotificationView[];
  onOpen(notification: NotificationView): void;
  label: string;
}) {
  return (
    <ul className="divide-y" aria-label={label}>
      {items.map((notification) => {
        const unread = notification.readAt === null;
        return (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => onOpen(notification)}
              className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-slate-50"
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  unread ? "bg-brand-600" : "bg-transparent",
                )}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm",
                    unread ? "font-semibold text-slate-900" : "text-slate-700",
                  )}
                >
                  {notification.title}
                  {unread && <span className="sr-only"> (unread)</span>}
                </span>
                <span className="block text-xs text-muted-foreground">{notification.body}</span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  {formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
