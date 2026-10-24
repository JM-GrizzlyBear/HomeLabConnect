import type { LeaveView } from "@homelabconnect/shared";
import { format } from "date-fns";
import { CircleAlertIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import { LeaveCard } from "@/components/scheduling/LeaveCard";
import { LeaveInbox } from "@/components/scheduling/LeaveInbox";
import { LeaveRequestDialog } from "@/components/scheduling/LeaveRequestDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../api/apiClient";
import { cancelLeave, fetchLeaveInbox, fetchMyLeave } from "../api/scheduling";
import { useApiData } from "../api/useApiData";
import { useAuth } from "../auth/authContext";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";

const isCancellable = (leave: LeaveView, today: string) =>
  leave.status === "pending" || (leave.status === "approved" && leave.startsOn > today);

/**
 * A staff member's leave: request it, follow it through approval, cancel it.
 * Team leads also see their team's requests waiting for them here.
 */
export function MyLeavePage() {
  const { token } = useAuth();
  const feedback = useFeedback();
  const [requesting, setRequesting] = useState(false);
  const mine = useApiData(fetchMyLeave, [], {
    errorMessage: "Could not load your leave. Try again.",
  });
  const inbox = useApiData(fetchLeaveInbox, []);
  const today = format(new Date(), "yyyy-MM-dd");

  async function withdraw(leave: LeaveView) {
    const confirmed = await feedback.confirm({
      title: "Cancel this leave request?",
      description: "You can request it again later.",
      confirmLabel: "Cancel request",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!confirmed || !token) return;
    try {
      await cancelLeave(token, leave.id);
      feedback.success({ title: "Leave request cancelled" });
      mine.reload();
    } catch (error) {
      feedback.error({
        title: "Couldn't cancel the request",
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <>
      <PageHeader
        title="My Leave"
        action={
          <Button onClick={() => setRequesting(true)}>
            <PlusIcon />
            Request leave
          </Button>
        }
      />

      {inbox.data && inbox.data.length > 0 && (
        <ContentCard title="Waiting for your approval" className="mb-6">
          <LeaveInbox requests={inbox.data} onDecided={inbox.reload} />
        </ContentCard>
      )}

      <ContentCard title="My requests">
        {mine.error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{mine.error}</AlertDescription>
          </Alert>
        ) : !mine.data ? (
          <Skeleton className="h-32" aria-label="Loading your leave" />
        ) : mine.data.length === 0 ? (
          <EmptyState
            title="No leave requested yet."
            description="Request leave and follow it here."
          />
        ) : (
          <ul className="divide-y">
            {mine.data.map((leave) => (
              <LeaveCard
                key={leave.id}
                leave={leave}
                actions={
                  isCancellable(leave, today) && (
                    <Button size="sm" variant="outline" onClick={() => void withdraw(leave)}>
                      Cancel request
                    </Button>
                  )
                }
              />
            ))}
          </ul>
        )}
      </ContentCard>

      <LeaveRequestDialog
        open={requesting}
        onClose={() => setRequesting(false)}
        onFiled={mine.reload}
      />
    </>
  );
}
