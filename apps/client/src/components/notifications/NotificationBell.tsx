import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchNotifications } from "../../api/notifications";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { NavIcon } from "../navIcons";
import { NotificationList } from "./NotificationList";
import { useNotificationActions } from "./useNotificationActions";

const LATEST = { page: 1, pageSize: 10, unread: false };

/** The bell: how many are unread, and the latest 10 a click away. */
export function NotificationBell({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const { data } = useApiQuery(
    queryKeys.notifications(LATEST),
    async (signal) => await fetchNotifications(LATEST, signal),
    { errorMessage: "Could not load your notifications." },
  );
  const actions = useNotificationActions();
  const unread = data?.unread ?? 0;
  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <NavIcon name="bell" className="size-6" />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={() => void actions.markAll()}>
              Mark all read
            </Button>
          )}
        </div>
        {!data || data.items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {data ? "You're all caught up." : "Loading…"}
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <NotificationList
              items={data.items}
              label="Latest notifications"
              onOpen={(notification) => {
                close();
                void actions.open(notification);
              }}
            />
          </div>
        )}
        <div className="border-t px-3 py-2 text-center">
          <Link
            to="/app/notifications"
            onClick={close}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            See all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
