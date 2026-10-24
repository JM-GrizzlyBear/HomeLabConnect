import type { LeaveStatus } from "@homelabconnect/shared";
import { CircleAlertIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import { SelectInputField } from "@/components/form/SelectInputField";
import { LeaveCard } from "@/components/scheduling/LeaveCard";
import { LeaveInbox } from "@/components/scheduling/LeaveInbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAllLeave, fetchLeaveInbox } from "../api/scheduling";
import { useApiData } from "../api/useApiData";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { leaveStatusLabels } from "../format/leave";

const ALL = "all";
const statusOptions = [
  { value: ALL, label: "Any status" },
  ...(Object.keys(leaveStatusLabels) as LeaveStatus[]).map((status) => ({
    value: status,
    label: leaveStatusLabels[status],
  })),
];

/** For approvers: what's waiting for them, and (with leave.view) everyone's requests. */
export function LeaveRequestsPage() {
  const can = useCan();
  const canViewAll = can("leave.view");
  const [status, setStatus] = useState<LeaveStatus | typeof ALL>("pending");
  const inbox = useApiData(fetchLeaveInbox, [], {
    errorMessage: "Could not load the requests. Try again.",
  });
  const all = useApiData(
    (token, signal) => fetchAllLeave(token, status === ALL ? null : status, signal),
    [status],
    { enabled: canViewAll, errorMessage: "Could not load the requests. Try again." },
  );
  const reloadBoth = () => {
    inbox.reload();
    if (canViewAll) all.reload();
  };

  const waiting = (
    <ContentCard title="Waiting for you">
      {inbox.error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{inbox.error}</AlertDescription>
        </Alert>
      ) : !inbox.data ? (
        <Skeleton className="h-32" aria-label="Loading requests" />
      ) : inbox.data.length === 0 ? (
        <EmptyState title="Nothing is waiting for you." />
      ) : (
        <LeaveInbox requests={inbox.data} onDecided={reloadBoth} />
      )}
    </ContentCard>
  );

  return (
    <>
      <PageHeader title="Leave Requests" />
      {canViewAll ? (
        <Tabs defaultValue="waiting">
          <TabsList className="mb-4">
            <TabsTrigger value="waiting">
              Waiting for me{inbox.data?.length ? ` (${inbox.data.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="all">All requests</TabsTrigger>
          </TabsList>
          <TabsContent value="waiting">{waiting}</TabsContent>
          <TabsContent value="all">
            <ContentCard
              title="All requests"
              action={
                <SelectInputField
                  label="Status"
                  hideLabel
                  size="sm"
                  options={statusOptions}
                  value={status}
                  onValueChange={(value) => setStatus(value as typeof status)}
                  className="w-36"
                />
              }
            >
              {all.error ? (
                <Alert variant="destructive">
                  <CircleAlertIcon />
                  <AlertDescription>{all.error}</AlertDescription>
                </Alert>
              ) : !all.data ? (
                <Skeleton className="h-32" aria-label="Loading requests" />
              ) : all.data.length === 0 ? (
                <EmptyState title="No requests with this status." />
              ) : (
                <ul className="divide-y">
                  {all.data.map((leave) => (
                    <LeaveCard key={leave.id} leave={leave} showRequester />
                  ))}
                </ul>
              )}
            </ContentCard>
          </TabsContent>
        </Tabs>
      ) : (
        waiting
      )}
    </>
  );
}
