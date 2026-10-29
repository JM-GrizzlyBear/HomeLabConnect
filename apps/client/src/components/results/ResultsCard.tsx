import type { AppointmentResults, AppointmentView, TestResultView } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { CreditCardIcon, FileTextIcon, LockIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "../../api/apiClient";
import { fetchAppointmentPayments, startCardPayment } from "../../api/payments";
import { useAuth } from "../../auth/authContext";
import { deleteTestResult, fetchAppointmentResults, releaseResults } from "../../api/results";
import { useFeedback } from "../../feedback/feedbackContext";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { ContentCard } from "../layout/ContentCard";
import { UploadResultDialog } from "./UploadResultDialog";

interface ResultsCardProps {
  appointment: AppointmentView;
  className?: string;
}

/**
 * The lab results of a collected visit. Doctors upload a file per test, then release them;
 * the patient sees them once released and the visit is paid.
 */
export function ResultsCard({ appointment, className }: ResultsCardProps) {
  const feedback = useFeedback();
  const [uploading, setUploading] = useState<AppointmentResults["tests"][number] | null>(null);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const isOwner = user?.id === appointment.patient.id;
  const { data, reload } = useApiQuery(
    queryKeys.results(appointment.id),
    async (signal) => await fetchAppointmentResults(appointment.id, signal),
    { errorMessage: "Could not load the results." },
  );
  // Shared with the Payment card: whether card payment is on
  const { data: payments } = useApiQuery(
    queryKeys.appointmentPayments(appointment.id),
    async (signal) => await fetchAppointmentPayments(appointment.id, signal),
    { enabled: isOwner, errorMessage: "Could not load the payments." },
  );
  if (!data || data.state === "none") return null;

  async function act(action: () => Promise<void>, success: string, failure: string) {
    setBusy(true);
    try {
      await action();
      reload();
      feedback.success({ title: success });
    } catch (error) {
      feedback.error({
        title: failure,
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function release() {
    const confirmed = await feedback.confirm({
      title: `Release the results of ${appointment.code}?`,
      description: `${appointment.patient.name} is emailed, and sees them once the visit is paid. Released results can't be changed.`,
      confirmLabel: "Release results",
    });
    if (confirmed) {
      await act(
        async () => await releaseResults(appointment.id),
        "Results released",
        "Couldn't release the results",
      );
    }
  }

  async function payNow() {
    setBusy(true);
    try {
      window.location.assign(await startCardPayment(appointment.id));
    } catch (error) {
      feedback.error({
        title: "Couldn't open the payment page",
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
      setBusy(false);
    }
  }

  const released = data.tests.some((test) => test.result?.releasedAt);
  const allUploaded = data.tests.every((test) => test.result);

  return (
    <ContentCard
      title="Results"
      className={className}
      action={
        data.canManage &&
        !released && (
          <Button size="sm" disabled={!allUploaded} loading={busy} onClick={() => void release()}>
            Release results
          </Button>
        )
      }
    >
      {!data.canManage && data.state === "pending" && (
        <p className="text-sm text-muted-foreground">
          Your samples are with our doctors. We'll email you when the results are ready.
        </p>
      )}
      {!data.canManage && data.state === "locked" && (
        <div className="grid gap-3 rounded-xl bg-muted/50 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <LockIcon className="size-4" />
            Your results are ready. Pay to view them.
          </p>
          {isOwner && payments?.cardEnabled ? (
            <div>
              <Button size="sm" loading={busy} onClick={() => void payNow()}>
                <CreditCardIcon />
                Pay now
              </Button>
            </div>
          ) : (
            isOwner && (
              <p className="text-muted-foreground">Contact us to pay, and they open right away.</p>
            )
          )}
        </div>
      )}
      {(data.canManage || data.state === "ready") && (
        <ul className="grid gap-2">
          {data.tests.map((test) => (
            <li
              key={test.procedureId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {test.name} <span className="text-muted-foreground">({test.code})</span>
                </p>
                {test.result ? (
                  <ResultSummary result={test.result} />
                ) : (
                  <p className="text-sm text-muted-foreground">No result yet</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {test.result && (
                  <Button asChild size="sm" variant="outline">
                    <a href={test.result.fileUrl} target="_blank" rel="noreferrer">
                      <FileTextIcon />
                      View
                    </a>
                  </Button>
                )}
                {data.canManage && !released && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setUploading(test)}>
                      <UploadIcon />
                      {test.result ? "Replace" : "Upload"}
                    </Button>
                    {test.result && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Remove the ${test.code} result`}
                        disabled={busy}
                        onClick={() =>
                          void act(
                            async () => await deleteTestResult(appointment.id, test.procedureId),
                            "Result removed",
                            "Couldn't remove the result",
                          )
                        }
                      >
                        <Trash2Icon />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {data.canManage && released && (
        <p className="mt-3 text-sm text-muted-foreground">
          Released.{" "}
          {appointment.paymentStatus === "unpaid" &&
            "The patient sees them once the visit is paid."}
        </p>
      )}
      <UploadResultDialog
        appointmentId={appointment.id}
        test={uploading}
        onClose={() => setUploading(null)}
        onUploaded={reload}
      />
    </ContentCard>
  );
}

function ResultSummary({ result }: { result: TestResultView }) {
  return (
    <div className="text-sm text-muted-foreground">
      <p className="flex flex-wrap items-center gap-x-2">
        <span className="truncate">{result.filename}</span>
        {!result.releasedAt && <Badge variant="secondary">Draft</Badge>}
      </p>
      {result.comment && <p className="text-foreground">{result.comment}</p>}
      <p>
        {result.uploadedBy.name} · {format(parseISO(result.uploadedAt), "MMM d, h:mm a")}
      </p>
    </div>
  );
}
