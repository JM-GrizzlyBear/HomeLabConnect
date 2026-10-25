import { type AppointmentView, recordVisitRequestSchema } from "@homelabconnect/shared";
import { addDays, format, parseISO } from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  MapPinIcon,
  PhoneIcon,
} from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import { FormField } from "@/components/form/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "../api/apiClient";
import { fetchMyVisits, recordVisit } from "../api/appointments";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { appointmentStatusLabels, appointmentStatusVariants } from "../format/appointments";
import { formatTime } from "../format/settings";
import { useFormState } from "../forms/useFormState";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

const iso = (date: Date) => format(date, "yyyy-MM-dd");

type Recording = { visit: AppointmentView; outcome: "collected" | "not_collected" } | null;

/** A med team member's visits for a day, in time order, with what to do at each. */
export function MyVisitsPage() {
  const feedback = useFeedback();
  const [date, setDate] = useState(() => iso(new Date()));
  const [recording, setRecording] = useState<Recording>(null);
  const {
    data: visits,
    error,
    reload,
  } = useApiQuery(queryKeys.myVisits(date), async (signal) => await fetchMyVisits(date, signal), {
    errorMessage: "Could not load your visits. Try again.",
  });

  async function setOff(visit: AppointmentView) {
    try {
      await recordVisit(visit.id, { outcome: "on_the_way" });
      feedback.success({ title: "Marked on the way" });
      reload();
    } catch (failure) {
      feedback.error({
        title: "Couldn't update the visit",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  const shift = (days: number) => setDate(iso(addDays(parseISO(date), days)));

  return (
    <>
      <PageHeader title="My Visits" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" aria-label="Previous day" onClick={() => shift(-1)}>
          <ChevronLeftIcon />
        </Button>
        <span className="min-w-48 text-center font-medium">
          {format(parseISO(date), "EEEE, MMMM d, yyyy")}
        </span>
        <Button variant="outline" size="sm" aria-label="Next day" onClick={() => shift(1)}>
          <ChevronRightIcon />
        </Button>
        {date !== iso(new Date()) && (
          <Button variant="ghost" size="sm" onClick={() => setDate(iso(new Date()))}>
            Today
          </Button>
        )}
      </div>

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !visits ? (
        <Skeleton className="h-40" aria-label="Loading your visits" />
      ) : visits.length === 0 ? (
        <ContentCard title="Visits">
          <EmptyState
            title="No visits for your team this day."
            description="Visits show here once staff assign them to your team."
          />
        </ContentCard>
      ) : (
        <ol className="grid gap-4" aria-label="Visits">
          {visits.map((visit) => (
            <li key={visit.id}>
              <ContentCard title={`${formatTime(visit.slot)} · ${visit.patient.name}`}>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <p className="flex gap-2">
                    <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      {visit.address}
                      {visit.landmark && (
                        <span className="block text-muted-foreground">{visit.landmark}</span>
                      )}
                    </span>
                  </p>
                  {visit.patient.phone && (
                    <p className="flex gap-2">
                      <PhoneIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <a
                        href={`tel:${visit.patient.phone}`}
                        className="text-brand-700 hover:underline"
                      >
                        {visit.patient.phone}
                      </a>
                    </p>
                  )}
                  <p className="sm:col-span-2">
                    <span className="text-muted-foreground">Tests: </span>
                    {visit.lines.map((line) => line.name).join(", ")}
                  </p>
                  {visit.notes && (
                    <p className="sm:col-span-2">
                      <span className="text-muted-foreground">Patient's note: </span>
                      {visit.notes}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant={appointmentStatusVariants[visit.status]}>
                    {visit.code} · {appointmentStatusLabels[visit.status]}
                  </Badge>
                  {visit.status === "confirmed" && (
                    <Button size="sm" onClick={() => void setOff(visit)}>
                      On the way
                    </Button>
                  )}
                  {visit.status === "on_the_way" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setRecording({ visit, outcome: "collected" })}
                      >
                        Collected
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRecording({ visit, outcome: "not_collected" })}
                      >
                        Couldn't collect
                      </Button>
                    </>
                  )}
                </div>
              </ContentCard>
            </li>
          ))}
        </ol>
      )}

      <RecordVisitDialog
        recording={recording}
        onClose={() => setRecording(null)}
        onRecorded={() => {
          setRecording(null);
          reload();
        }}
      />
    </>
  );
}

interface RecordVisitDialogProps {
  recording: Recording;
  onClose(): void;
  onRecorded(): void;
}

/** Collected: tick the tests taken, with a note. Couldn't collect: say why. */
function RecordVisitDialog({ recording, onClose, onRecorded }: RecordVisitDialogProps) {
  return (
    <Dialog open={recording !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {recording && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {recording.outcome === "collected" ? "Samples collected" : "Couldn't collect"}
            </DialogTitle>
            <DialogDescription>
              {recording.visit.code} · {recording.visit.patient.name}
            </DialogDescription>
          </DialogHeader>
          <RecordVisitForm recording={recording} onClose={onClose} onRecorded={onRecorded} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function RecordVisitForm({
  recording,
  onClose,
  onRecorded,
}: { recording: NonNullable<Recording> } & Omit<RecordVisitDialogProps, "recording">) {
  const feedback = useFeedback();
  const { visit, outcome } = recording;
  const { values, errors, submitting, setValues, submit } = useFormState({
    collectedProcedureIds: visit.lines.map((line) => line.procedureId),
    text: "",
  });

  function toggle(procedureId: string) {
    const ids = values.collectedProcedureIds;
    setValues({
      collectedProcedureIds: ids.includes(procedureId)
        ? ids.filter((id) => id !== procedureId)
        : [...ids, procedureId],
    });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // Checked by the shared schema below, which also gives each field its message
    const request: unknown =
      outcome === "collected"
        ? {
            outcome,
            collectedProcedureIds: values.collectedProcedureIds,
            note: values.text.trim() || null,
          }
        : { outcome, reason: values.text };
    await submit(
      recordVisitRequestSchema.safeParse(request),
      async (record) => {
        await recordVisit(visit.id, record);
        feedback.success({
          title: outcome === "collected" ? "Visit recorded" : "Recorded as not collected",
        });
        onRecorded();
      },
      { title: "Couldn't record the visit" },
    );
  }

  const textError = outcome === "collected" ? errors.note : errors.reason;
  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      {outcome === "collected" && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Tests collected</legend>
          {visit.lines.map((line) => (
            <label key={line.procedureId} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={values.collectedProcedureIds.includes(line.procedureId)}
                onCheckedChange={() => toggle(line.procedureId)}
              />
              {line.name}
            </label>
          ))}
          {errors.collectedProcedureIds && (
            <p className="text-sm text-destructive">{errors.collectedProcedureIds}</p>
          )}
        </fieldset>
      )}
      <FormField
        label={outcome === "collected" ? "Note" : "Reason"}
        optional={outcome === "collected"}
        error={textError}
      >
        {(control) => (
          <Textarea
            {...control}
            rows={3}
            placeholder={
              outcome === "collected"
                ? "e.g. Lipid needs fasting; rebook."
                : "e.g. Nobody was home."
            }
            value={values.text}
            onChange={(event) => setValues({ text: event.target.value })}
          />
        )}
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Back
        </Button>
        <Button type="submit" loading={submitting}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
