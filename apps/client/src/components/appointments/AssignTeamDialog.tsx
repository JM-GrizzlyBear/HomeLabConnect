import type { AppointmentView } from "@homelabconnect/shared";
import { useState } from "react";
import { RadioGroupField } from "@/components/form/RadioGroupField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../../api/apiClient";
import { assignTeam, fetchTeamChoices } from "../../api/appointments";
import { useFeedback } from "../../feedback/feedbackContext";
import { formatVisit } from "../../format/appointments";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";

interface AssignTeamDialogProps {
  open: boolean;
  appointment: AppointmentView;
  onClose(): void;
  onAssigned(updated: AppointmentView): void;
}

const NONE = "none";

/** Staff pick which med team on duty goes on a confirmed visit. */
export function AssignTeamDialog({
  open,
  appointment,
  onClose,
  onAssigned,
}: AssignTeamDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {open && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign a team to {appointment.code}</DialogTitle>
            <DialogDescription>
              {formatVisit(appointment.date, appointment.slot)}. Only teams on duty that day are
              listed; a team does one visit per time slot.
            </DialogDescription>
          </DialogHeader>
          <AssignTeamForm appointment={appointment} onClose={onClose} onAssigned={onAssigned} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function AssignTeamForm({ appointment, onClose, onAssigned }: Omit<AssignTeamDialogProps, "open">) {
  const feedback = useFeedback();
  const [choice, setChoice] = useState(appointment.team?.id ?? "");
  const [saving, setSaving] = useState(false);
  const { data: teams, error } = useApiQuery(
    queryKeys.teamChoices(appointment.id),
    async (signal) => await fetchTeamChoices(appointment.id, signal),
    { errorMessage: "Could not load the teams. Try again." },
  );

  async function save() {
    setSaving(true);
    try {
      const updated = await assignTeam(appointment.id, choice === NONE ? null : choice);
      onAssigned(updated);
      feedback.success({
        title: updated.team ? `${updated.team.name} assigned` : "Team removed",
      });
    } catch (failure) {
      feedback.error({
        title: "Couldn't assign the team",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  const options = (teams ?? []).map((team) => ({
    value: team.teamId,
    label: team.name,
    hint: team.available
      ? `${team.visitsThatDay} ${team.visitsThatDay === 1 ? "visit" : "visits"} that day`
      : "Busy at this time or full that day",
    disabled: !team.available && team.teamId !== appointment.team?.id,
  }));
  if (appointment.team)
    options.push({ value: NONE, label: "No team yet", hint: "", disabled: false });

  return (
    <>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !teams ? (
        <Skeleton className="h-24" aria-label="Loading teams" />
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No team is on duty that day. Set a roster and shifts first, or propose another time.
        </p>
      ) : (
        <RadioGroupField label="Team" options={options} value={choice} onValueChange={setChoice} />
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Back
        </Button>
        <Button
          type="button"
          loading={saving}
          disabled={!choice || choice === (appointment.team?.id ?? "")}
          onClick={() => void save()}
        >
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
