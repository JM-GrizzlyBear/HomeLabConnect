import { type MedTeam, medTeamRequestSchema } from "@homelabconnect/shared";
import type { SubmitEvent } from "react";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTeam, updateTeam } from "../../api/scheduling";
import { useAuth } from "../../auth/authContext";
import { useFeedback } from "../../feedback/feedbackContext";
import { useFormState } from "../../forms/useFormState";

/** "new" to add a team, a team to rename it, or null when closed. */
export type TeamDialogTarget = "new" | MedTeam | null;

interface TeamDialogProps {
  target: TeamDialogTarget;
  onClose(): void;
  onSaved(): void;
}

export function TeamDialog({ target, onClose, onSaved }: TeamDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{target === "new" ? "New med team" : `Edit ${target.name}`}</DialogTitle>
            <DialogDescription>Members are chosen for each two-week period.</DialogDescription>
          </DialogHeader>
          <TeamForm
            key={target === "new" ? "new" : target.id}
            team={target === "new" ? null : target}
            onClose={onClose}
            onSaved={onSaved}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function TeamForm({
  team,
  onClose,
  onSaved,
}: {
  team: MedTeam | null;
  onClose(): void;
  onSaved(): void;
}) {
  const { token } = useAuth();
  const feedback = useFeedback();
  const { values, submitting, field, submit } = useFormState({
    name: team?.name ?? "",
    area: team?.area ?? "",
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    await submit(
      medTeamRequestSchema.safeParse({ name: values.name, area: values.area.trim() || null }),
      async (request) => {
        const saved = team
          ? await updateTeam(token, team.id, request)
          : await createTeam(token, request);
        onClose();
        onSaved();
        feedback.success({
          title: team ? "Team saved" : "Team added",
          description: team ? `${saved.name} is updated.` : `Give ${saved.name} a roster next.`,
        });
      },
      { title: "Couldn't save the team", fieldByCode: { team_name_taken: "name" } },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <TextInputField
        label="Name"
        placeholder="e.g. Team Pasig"
        autoComplete="off"
        {...field("name")}
      />
      <TextInputField
        label="Area"
        required={false}
        placeholder="e.g. Pasig, Mandaluyong"
        hint="Where the team usually goes."
        autoComplete="off"
        {...field("area")}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {team ? "Save" : "Add team"}
        </Button>
      </DialogFooter>
    </form>
  );
}
