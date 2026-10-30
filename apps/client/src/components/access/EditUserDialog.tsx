import { updateUserRequestSchema, type UserSummary } from "@homelabconnect/shared";
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
import { updateUser } from "../../api/users";
import { useFeedback } from "../../feedback/feedbackContext";
import { useFormState } from "../../forms/useFormState";

interface EditUserDialogProps {
  /** The user to edit, or null when closed. */
  user: UserSummary | null;
  onClose(): void;
  onSaved(): void;
}

/** An admin corrects someone's name, email or phone. */
export function EditUserDialog({ user, onClose, onSaved }: EditUserDialogProps) {
  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      {user && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit {user.firstName} {user.lastName}
            </DialogTitle>
            <DialogDescription>
              Changing the email changes what they sign in with.
            </DialogDescription>
          </DialogHeader>
          <EditUserForm key={user.id} user={user} onClose={onClose} onSaved={onSaved} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function EditUserForm({ user, onClose, onSaved }: EditUserDialogProps & { user: UserSummary }) {
  const feedback = useFeedback();
  const { values, submitting, field, submit } = useFormState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit(
      updateUserRequestSchema.safeParse({ ...values, phone: values.phone.trim() || null }),
      async (changes) => {
        await updateUser(user.id, changes);
        feedback.success({ title: "User updated" });
        onSaved();
        onClose();
      },
      {
        title: "Couldn't update the user",
        fieldByCode: { email_taken: "email", phone_required: "phone" },
      },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInputField label="First name" autoComplete="off" {...field("firstName")} />
        <TextInputField label="Last name" autoComplete="off" {...field("lastName")} />
      </div>
      <TextInputField label="Email" type="email" autoComplete="off" {...field("email")} />
      <TextInputField
        label="Phone"
        type="tel"
        autoComplete="off"
        required={user.role === "patient"}
        {...field("phone")}
      />
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
