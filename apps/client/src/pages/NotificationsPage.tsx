import { CircleAlertIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import { TablePagination } from "@/components/data/TablePagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchNotifications } from "../api/notifications";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { NotificationList } from "../components/notifications/NotificationList";
import { useNotificationActions } from "../components/notifications/useNotificationActions";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

const PAGE_SIZE = 20;

/** Everything that's happened to you, newest first. */
export function NotificationsPage() {
  const [filters, setFilters] = useState({ page: 1, pageSize: PAGE_SIZE, unread: false });
  const { data, error } = useApiQuery(
    queryKeys.notifications(filters),
    async (signal) => await fetchNotifications(filters, signal),
    { errorMessage: "Could not load your notifications. Try again." },
  );
  const actions = useNotificationActions();

  return (
    <>
      <PageHeader
        title="Notifications"
        action={
          (data?.unread ?? 0) > 0 && (
            <Button variant="outline" onClick={() => void actions.markAll()}>
              Mark all read
            </Button>
          )
        }
      />
      <ContentCard title="Your notifications">
        <Tabs
          value={filters.unread ? "unread" : "all"}
          onValueChange={(tab) =>
            setFilters((current) => ({ ...current, unread: tab === "unread", page: 1 }))
          }
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread{data ? ` (${data.unread})` : ""}</TabsTrigger>
          </TabsList>
        </Tabs>
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !data ? (
          <Skeleton className="h-40" aria-label="Loading your notifications" />
        ) : data.items.length === 0 ? (
          <EmptyState title={filters.unread ? "You're all caught up." : "No notifications yet."} />
        ) : (
          <div className="grid gap-4">
            <NotificationList
              items={data.items}
              label="Notifications"
              onOpen={(notification) => void actions.open(notification)}
            />
            <TablePagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </div>
        )}
      </ContentCard>
    </>
  );
}
