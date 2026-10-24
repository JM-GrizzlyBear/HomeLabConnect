import { type MedTeam, rosterRequestSchema } from "@homelabconnect/shared";
import { type SubmitEvent, useId } from "react";
import { SelectInputField } from "@/components/form/SelectInputField";
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
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStaff, saveRoster } from "../../api/scheduling";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { useFeedback } from "../../feedback/feedbackContext";
import { useFormState } from "../../forms/useFormState";

interface RosterDialogProps {
  /** The team whose roster is edited, or null when closed. */
  team: MedTeam | null;
  periodStart: string;
  /** e.g. "Oct 5 – Oct 18, 2026", for the title. */
  periodLabel: string;
  onClose(): void;
  onSaved(): void;
}

/** Chooses a team's members and lead for one two-week period. */
export function RosterDialog({
  team,
  periodStart,
  periodLabel,
  onClose,
  onSaved,
}: RosterDialogProps) {
  return (
    <Dialog open={team !== null} onOpenChange={(open) => !open && onClose()}>
      {team && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{team.name} roster</DialogTitle>
            <DialogDescription>
              {periodLabel}. Each person can be on one team per period.
            </DialogDescription>
          </DialogHeader>
          <RosterForm
            key={`${team.id}-${periodStart}`}
            team={team}
            periodStart={periodStart}
            onClose={onClose}
            onSaved={onSaved}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function RosterForm({
  team,
  periodStart,
  onClose,
  onSaved,
}: Omit<RosterDialogProps, "team" | "periodLabel"> & { team: MedTeam }) {
  const feedback = useFeedback();
  const id = useId();
  const staff = useApiQuery(queryKeys.staff("med_team"), (signal) =>
    fetchStaff("med_team", signal),
  );
  const { values, errors, submitting, setValues, submit } = useFormState({
    memberIds: team.members.map((member) => member.id),
    leadUserId: team.lead?.id ?? "",
  });

  const people = staff.data ?? [];
  const nameOf = (personId: string) => {
    const person = people.find((candidate) => candidate.id === personId);
    return person ? `${person.firstName} ${person.lastName}` : "Former staff";
  };

  function toggle(personId: string, on: boolean) {
    const memberIds = on
      ? [...values.memberIds, personId]
      : values.memberIds.filter((memberId) => memberId !== personId);
    setValues({
      memberIds,
      // A lead taken off the team is no longer the lead.
      leadUserId: memberIds.includes(values.leadUserId) ? values.leadUserId : "",
    });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit(
      rosterRequestSchema.safeParse({
        memberIds: values.memberIds,
        leadUserId: values.leadUserId || null,
      }),
      async (request) => {
        await saveRoster(team.id, periodStart, request);
        onClose();
        onSaved();
        feedback.success({
          title: "Roster saved",
          description:
            request.memberIds.length === 0
              ? `${team.name} has nobody for these two weeks.`
              : `${team.name} has ${request.memberIds.length} ${request.memberIds.length === 1 ? "member" : "members"}.`,
        });
      },
      { title: "Couldn't save the roster", fieldByCode: { roster_clash: "memberIds" } },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium text-slate-700">Members</legend>
        {staff.data ? (
          <ul className="max-h-64 divide-y overflow-y-auto rounded-lg border">
            {people.map((person) => (
              <li key={person.id} className="flex items-center gap-3 px-3 py-2">
                <Checkbox
                  id={`${id}-${person.id}`}
                  checked={values.memberIds.includes(person.id)}
                  onCheckedChange={(checked) => toggle(person.id, checked === true)}
                />
                <Label htmlFor={`${id}-${person.id}`} className="font-normal">
                  {person.firstName} {person.lastName}
                </Label>
              </li>
            ))}
            {people.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No active med team staff.
              </li>
            )}
          </ul>
        ) : (
          <Skeleton className="h-40" aria-label="Loading med team staff" />
        )}
        {errors.memberIds && <FieldError role={undefined}>{errors.memberIds}</FieldError>}
      </fieldset>
      <SelectInputField
        label="Team lead"
        placeholder={values.memberIds.length ? "Choose the lead" : "Add members first"}
        options={values.memberIds.map((memberId) => ({ value: memberId, label: nameOf(memberId) }))}
        value={values.leadUserId}
        onValueChange={(leadUserId) => setValues({ leadUserId })}
        disabled={values.memberIds.length === 0}
        hint="The lead approves the team's leave first."
        error={errors.leadUserId}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save roster
        </Button>
      </DialogFooter>
    </form>
  );
}
