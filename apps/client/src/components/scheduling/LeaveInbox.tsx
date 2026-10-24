import { leaveDecisionRequestSchema, type LeaveView } from "@homelabconnect/shared";
import { type SubmitEvent, useState } from "react";
import { FormField } from "@/components/form/FormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { decideLeave } from "../../api/scheduling";
import { useFeedback } from "../../feedback/feedbackContext";
import { approvalStepLabels, formatLeaveDates, leaveTypeLabels } from "../../format/leave";
import { useFormState } from "../../forms/useFormState";
import { LeaveCard } from "./LeaveCard";

interface Deciding {
  leave: LeaveView;
  decision: "approved" | "rejected";
}

interface LeaveInboxProps {
  requests: readonly LeaveView[];
  /** Called after a decision, to reload the lists. */
  onDecided(): void;
}

/** Requests waiting for this person, each with Approve and Reject. */
export function LeaveInbox({ requests, onDecided }: LeaveInboxProps) {
  const [deciding, setDeciding] = useState<Deciding | null>(null);

  return (
    <>
      <ul className="divide-y">
        {requests.map((leave) => (
          <LeaveCard
            key={leave.id}
            leave={leave}
            showRequester
            actions={
              <>
                <Button size="sm" onClick={() => setDeciding({ leave, decision: "approved" })}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeciding({ leave, decision: "rejected" })}
                >
                  Reject
                </Button>
              </>
            }
          />
        ))}
      </ul>
      <Dialog open={deciding !== null} onOpenChange={(open) => !open && setDeciding(null)}>
        {deciding && (
          <DialogContent className="sm:max-w-md">
            <DecideForm
              key={`${deciding.leave.id}-${deciding.decision}`}
              deciding={deciding}
              onClose={() => setDeciding(null)}
              onDecided={onDecided}
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function DecideForm({
  deciding,
  onClose,
  onDecided,
}: {
  deciding: Deciding;
  onClose(): void;
  onDecided(): void;
}) {
  const feedback = useFeedback();
  const { leave, decision } = deciding;
  const approving = decision === "approved";
  const { values, errors, submitting, set, submit } = useFormState({ note: "" });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit(
      leaveDecisionRequestSchema.safeParse({ decision, note: values.note.trim() || null }),
      async (request) => {
        const decided = await decideLeave(leave.id, request);
        onClose();
        onDecided();
        feedback.success({
          title: approving ? "Leave approved" : "Leave rejected",
          description:
            decided.status === "pending" && decided.waitingFor
              ? `It now goes to ${approvalStepLabels[decided.waitingFor].toLowerCase()}.`
              : `${leave.requesterName} can see the decision.`,
        });
      },
      { title: "Couldn't record the decision" },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>
          {approving ? "Approve" : "Reject"} {leave.requesterName}'s{" "}
          {leaveTypeLabels[leave.type].toLowerCase()} leave?
        </DialogTitle>
        <DialogDescription>{formatLeaveDates(leave)}</DialogDescription>
      </DialogHeader>
      <FormField label="Note" optional={approving} error={errors.note}>
        {(control) => (
          <Textarea
            {...control}
            name="note"
            placeholder={approving ? "e.g. Covered by Juan" : "Why it can't be approved"}
            value={values.note}
            onChange={(e) => set("note")(e.target.value)}
          />
        )}
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant={approving ? "default" : "destructive"} loading={submitting}>
          {approving ? "Approve" : "Reject"}
        </Button>
      </DialogFooter>
    </form>
  );
}
