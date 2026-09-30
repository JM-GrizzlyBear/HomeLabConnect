import type { CustomRole, UserSummary } from "@homelabconnect/shared";
import { useEffect, useState } from "react";
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
import { ApiError } from "../../api/apiClient";
import { assignRole, fetchRoles } from "../../api/roles";
import { useAuth } from "../../auth/authContext";
import { roleLabels } from "../../auth/roleLabels";
import { useFeedback } from "../../feedback/feedbackContext";

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
  const { token } = useAuth();
  const feedback = useFeedback();
  const [customRoles, setCustomRoles] = useState<CustomRole[] | null>(null);
  const [choice, setChoice] = useState(NONE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !token) return;
    const controller = new AbortController();
    async function load(target: UserSummary, authToken: string) {
      try {
        const list = await fetchRoles(authToken, controller.signal);
        setCustomRoles(list.customRoles.filter((role) => role.baseRole === target.role));
        setChoice(target.customRole?.id ?? NONE);
      } catch {
        if (!controller.signal.aborted) setCustomRoles([]);
      }
    }
    void load(user, token);
    return () => controller.abort();
  }, [user, token]);

  async function save() {
    if (!user || !token) return;
    setSaving(true);
    try {
      const updated = await assignRole(token, user.id, choice === NONE ? null : choice);
      onClose();
      onChanged();
      feedback.success({
        title: "Role changed",
        description: `${updated.firstName} ${updated.lastName} is now ${
          updated.customRole?.name ?? `a plain ${roleLabels[updated.role]}`
        }. It applies on their next click.`,
      });
    } catch (error) {
      feedback.error({
        title: "Couldn't change the role",
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  const options = [
    { value: NONE, label: user ? `None: ${roleLabels[user.role]} only` : "None" },
    ...(customRoles ?? []).map((role) => ({ value: role.id, label: role.name })),
  ];

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
          <SelectInputField
            label="Custom role"
            options={options}
            value={choice}
            onValueChange={setChoice}
            disabled={customRoles === null}
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
              loading={saving}
              disabled={choice === (user.customRole?.id ?? NONE)}
            >
              Save role
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
