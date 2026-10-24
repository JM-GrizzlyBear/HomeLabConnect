import type { UserSummary } from "@homelabconnect/shared";
import { SelectInputField } from "@/components/form/SelectInputField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { assignRole, fetchRoles } from "../../api/roles";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { roleLabels } from "../../auth/roleLabels";
import { useFeedback } from "../../feedback/feedbackContext";
import { useFormState } from "../../forms/useFormState";

/** Radix Select can't use "" as a value, so this stands for "no custom role". */
const NONE = "none";

interface ChangeRoleDialogProps {
  /** The user to change, or null when closed. */
  user: UserSummary | null;
  onClose(): void;
  onChanged(): void;
}

/** Puts a user on a custom role built on their base role, or back on the base role. */
export function ChangeRoleDialog({ user, onClose, onChanged }: ChangeRoleDialogProps) {
  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      {user && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Change role for {user.firstName} {user.lastName}
            </DialogTitle>
            <DialogDescription>
              Custom roles built on {roleLabels[user.role]} can be assigned. The base role itself
              can't be changed.
            </DialogDescription>
          </DialogHeader>
          {/* Keyed so the choice starts from each user's current role. */}
          <ChangeRoleForm key={user.id} user={user} onClose={onClose} onChanged={onChanged} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function ChangeRoleForm({
  user,
  onClose,
  onChanged,
}: ChangeRoleDialogProps & { user: UserSummary }) {
  const feedback = useFeedback();
  const roles = useApiQuery(queryKeys.roles, fetchRoles);
  const { values, submitting, setValues, submit } = useFormState({
    choice: user.customRole?.id ?? NONE,
  });

  // A failed load leaves just "None", so the user can still be put back on the base role.
  const customRoles = roles.error
    ? []
    : roles.data?.customRoles.filter((role) => role.baseRole === user.role);
  const options = [
    { value: NONE, label: `None: ${roleLabels[user.role]} only` },
    ...(customRoles ?? []).map((role) => ({ value: role.id, label: role.name })),
  ];

  async function save() {
    await submit(
      { success: true, data: values.choice === NONE ? null : values.choice },
      async (customRoleId) => {
        const updated = await assignRole(user.id, customRoleId);
        onClose();
        onChanged();
        feedback.success({
          title: "Role changed",
          description: `${updated.firstName} ${updated.lastName} is now ${
            updated.customRole?.name ?? `a plain ${roleLabels[updated.role]}`
          }. It applies on their next click.`,
        });
      },
      { title: "Couldn't change the role" },
    );
  }

  return (
    <>
      <SelectInputField
        label="Custom role"
        options={options}
        value={values.choice}
        onValueChange={(choice) => setValues({ choice })}
        disabled={customRoles === undefined}
        hint={
          customRoles?.length === 0
            ? `No custom roles are built on ${roleLabels[user.role]} yet.`
            : undefined
        }
      />
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => void save()}
          loading={submitting}
          disabled={values.choice === (user.customRole?.id ?? NONE)}
        >
          Save role
        </Button>
      </DialogFooter>
    </>
  );
}
