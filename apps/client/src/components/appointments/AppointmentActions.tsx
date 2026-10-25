import {
  type AppointmentView,
  appointmentReasonRequestSchema,
  proposeTimeRequestSchema,
  returnVisitRequestSchema,
} from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
import { ApiError } from "../../api/apiClient";
import {
  acceptAppointment,
  answerProposal,
  cancelAppointment,
  fetchAvailability,
  proposeNewTime,
  rejectAppointment,
  scheduleReturnVisit,
} from "../../api/appointments";
import { useAuth } from "../../auth/authContext";
import { useCan } from "../../auth/useCan";
import { useFeedback } from "../../feedback/feedbackContext";
import { formatVisit, missedTests } from "../../format/appointments";
import { monthEnd, monthOf, shiftMonth } from "../../format/schedule";
import { useFormState } from "../../forms/useFormState";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { AssignTeamDialog } from "./AssignTeamDialog";
import { AvailabilityCalendar, SlotPicker } from "./AvailabilityCalendar";

interface AppointmentActionsProps {
  appointment: AppointmentView;
  onChanged(updated: AppointmentView): void;
}

type Open = "reject" | "cancel" | "propose" | "team" | "return" | null;

/**
 * What the viewer may do with an appointment right now: staff accept, reject, propose
 * a new time or cancel; the patient cancels or answers a proposed time.
 */
export function AppointmentActions({ appointment, onChanged }: AppointmentActionsProps) {
  const { user } = useAuth();
  const can = useCan();
  const feedback = useFeedback();
  const [open, setOpen] = useState<Open>(null);
  const [busy, setBusy] = useState(false);
  const isOwner = user?.id === appointment.patient.id;
  const staff = can("appointments.view_all");
  const { status } = appointment;

  async function run(action: () => Promise<AppointmentView>, success: string, failure: string) {
    setBusy(true);
    try {
      onChanged(await action());
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

  async function patientCancel() {
    const confirmed = await feedback.confirm({
      title: `Cancel ${appointment.code}?`,
      description: "You can book another visit any time.",
      confirmLabel: "Cancel visit",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (confirmed) {
      await run(
        async () => await cancelAppointment(appointment.id, null),
        "Visit cancelled",
        "Couldn't cancel the visit",
      );
    }
  }

  const buttons = [];
  if (staff && status === "pending" && can("appointments.accept")) {
    buttons.push(
      <Button
        key="accept"
        size="sm"
        loading={busy}
        onClick={() =>
          void run(
            async () => await acceptAppointment(appointment.id),
            "Booking confirmed",
            "Couldn't confirm the booking",
          )
        }
      >
        Accept
      </Button>,
    );
  }
  if (staff && status === "pending" && can("appointments.reject")) {
    buttons.push(
      <Button
        key="reject"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => setOpen("reject")}
      >
        Reject
      </Button>,
    );
  }
  if (staff && status === "confirmed" && can("appointments.assign")) {
    buttons.push(
      <Button
        key="team"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => setOpen("team")}
      >
        {appointment.team ? "Change team" : "Assign team"}
      </Button>,
    );
  }
  if (staff && ["pending", "confirmed"].includes(status) && can("appointments.reschedule")) {
    buttons.push(
      <Button
        key="propose"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => setOpen("propose")}
      >
        Propose new time
      </Button>,
    );
  }
  if (isOwner && status === "reschedule_proposed" && appointment.proposal) {
    buttons.push(
      <Button
        key="accept-time"
        size="sm"
        loading={busy}
        onClick={() =>
          void run(
            async () => await answerProposal(appointment.id, true),
            "New time accepted",
            "Couldn't accept the new time",
          )
        }
      >
        Accept new time
      </Button>,
      <Button
        key="decline-time"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() =>
          void run(
            async () => await answerProposal(appointment.id, false),
            "Visit cancelled",
            "Couldn't decline the new time",
          )
        }
      >
        Decline
      </Button>,
    );
  }
  if (
    missedTests(appointment).length > 0 &&
    appointment.returnVisits.length === 0 &&
    (can("visits.schedule_return") || can("appointments.assign"))
  ) {
    buttons.push(
      <Button key="return" size="sm" disabled={busy} onClick={() => setOpen("return")}>
        Schedule return visit
      </Button>,
    );
  }
  if (isOwner && appointment.cancellableUntil && can("appointments.cancel")) {
    buttons.push(
      <Button
        key="cancel"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => void patientCancel()}
      >
        Cancel visit
      </Button>,
    );
  } else if (
    staff &&
    !isOwner &&
    ["pending", "confirmed", "reschedule_proposed"].includes(status) &&
    can("appointments.cancel")
  ) {
    buttons.push(
      <Button
        key="cancel"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => setOpen("cancel")}
      >
        Cancel
      </Button>,
    );
  }

  if (buttons.length === 0) return null;
  return (
    <>
      <div className="flex flex-wrap gap-2">{buttons}</div>
      <ReasonDialog
        open={open === "reject" || open === "cancel"}
        title={open === "reject" ? `Reject ${appointment.code}` : `Cancel ${appointment.code}`}
        confirmLabel={open === "reject" ? "Reject booking" : "Cancel appointment"}
        onClose={() => setOpen(null)}
        onSubmit={async (reason) => {
          const updated =
            open === "reject"
              ? await rejectAppointment(appointment.id, reason)
              : await cancelAppointment(appointment.id, reason);
          onChanged(updated);
          setOpen(null);
          feedback.success({
            title: open === "reject" ? "Booking rejected" : "Appointment cancelled",
          });
        }}
      />
      <AssignTeamDialog
        open={open === "team"}
        appointment={appointment}
        onClose={() => setOpen(null)}
        onAssigned={(updated) => {
          onChanged(updated);
          setOpen(null);
        }}
      />
      <ProposeTimeDialog
        open={open === "propose" || open === "return"}
        mode={open === "return" ? "return" : "propose"}
        appointment={appointment}
        onClose={() => setOpen(null)}
        onProposed={(updated) => {
          onChanged(updated);
          setOpen(null);
          feedback.success({
            title:
              open === "return"
                ? `Return visit ${updated.code} booked`
                : "New time sent to the patient",
          });
        }}
      />
    </>
  );
}

interface ReasonDialogProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  onClose(): void;
  onSubmit(reason: string): Promise<void>;
}

/** Asks staff why they reject or cancel; the patient sees the reason. */
function ReasonDialog({ open, title, confirmLabel, onClose, onSubmit }: ReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {open && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              The patient sees this reason in the app and by email.
            </DialogDescription>
          </DialogHeader>
          <ReasonForm confirmLabel={confirmLabel} onClose={onClose} onSubmit={onSubmit} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function ReasonForm({
  confirmLabel,
  onClose,
  onSubmit,
}: Omit<ReasonDialogProps, "open" | "title">) {
  const { values, errors, submitting, setValues, submit } = useFormState({ reason: "" });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit(
      appointmentReasonRequestSchema.safeParse(values),
      async ({ reason }) => await onSubmit(reason),
      { title: "Couldn't save" },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <FormField label="Reason" error={errors.reason}>
        {(control) => (
          <Textarea
            {...control}
            rows={3}
            value={values.reason}
            onChange={(event) => setValues({ reason: event.target.value })}
          />
        )}
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Back
        </Button>
        <Button type="submit" variant="destructive" loading={submitting}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface ProposeTimeDialogProps {
  open: boolean;
  /** "propose": a new time the patient answers; "return": book a return visit for missed tests. */
  mode: "propose" | "return";
  appointment: AppointmentView;
  onClose(): void;
  onProposed(updated: AppointmentView): void;
}

/**
 * Picks another open date and time: either a new time the patient then accepts or declines,
 * or a return visit for the tests that weren't collected (booked straight away, at ₱0).
 */
function ProposeTimeDialog({
  open,
  mode,
  appointment,
  onClose,
  onProposed,
}: ProposeTimeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {open && (
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "return" ? "Schedule a return visit" : "Propose a new time"}
            </DialogTitle>
            <DialogDescription>
              {mode === "return"
                ? `For ${missedTests(appointment)
                    .map((line) => line.name)
                    .join(", ")}. It's confirmed straight away, at no extra charge.`
                : `Now booked for ${formatVisit(appointment.date, appointment.slot)}. The patient accepts or declines the new time.`}
            </DialogDescription>
          </DialogHeader>
          <ProposeForm
            mode={mode}
            appointment={appointment}
            onClose={onClose}
            onProposed={onProposed}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function ProposeForm({
  mode,
  appointment,
  onClose,
  onProposed,
}: Omit<ProposeTimeDialogProps, "open">) {
  const [month, setMonth] = useState(() => monthOf(appointment.date));
  const { values, errors, submitting, setValues, submit } = useFormState({
    date: "",
    slot: "",
    reason: "",
  });
  const availability = useApiQuery(
    queryKeys.availability(month, monthEnd(month)),
    async (signal) => await fetchAvailability(month, monthEnd(month), signal),
  );
  const day = availability.data?.find((candidate) => candidate.date === values.date) ?? null;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "return") {
      await submit(
        returnVisitRequestSchema.safeParse(values),
        async (request) => onProposed(await scheduleReturnVisit(appointment.id, request)),
        {
          title: "Couldn't book the return visit",
          fieldByCode: { slot_full: "slot", slot_not_bookable: "slot" },
        },
      );
      return;
    }
    await submit(
      proposeTimeRequestSchema.safeParse(values),
      async (request) => onProposed(await proposeNewTime(appointment.id, request)),
      {
        title: "Couldn't propose the time",
        fieldByCode: { slot_full: "slot", slot_not_bookable: "slot" },
      },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Previous month"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="text-sm font-medium">{format(parseISO(month), "MMMM yyyy")}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next month"
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <AvailabilityCalendar
          month={month}
          days={availability.data}
          selected={values.date || null}
          onSelect={(date) => setValues({ date, slot: "" })}
        />
      </div>
      {day && (
        <SlotPicker
          day={day}
          selected={values.slot || null}
          onSelect={(slot) => setValues({ slot })}
        />
      )}
      {(errors.date || errors.slot) && (
        <p className="text-sm text-destructive">{errors.slot ?? errors.date}</p>
      )}
      {mode === "propose" && (
        <FormField label="Reason for the patient" error={errors.reason}>
          {(control) => (
            <Textarea
              {...control}
              rows={2}
              value={values.reason}
              onChange={(event) => setValues({ reason: event.target.value })}
            />
          )}
        </FormField>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Back
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === "return" ? "Book return visit" : "Send new time"}
        </Button>
      </DialogFooter>
    </form>
  );
}
