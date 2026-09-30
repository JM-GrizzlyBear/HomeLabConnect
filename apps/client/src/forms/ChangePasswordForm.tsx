import { changePasswordFormSchema, type SessionUser } from "@homelabconnect/shared";
import type { SubmitEvent } from "react";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { changePassword } from "../api/auth";
import { useAuth } from "../auth/authContext";
import { useFormState } from "./useFormState";

const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

/** Errors the API reports about one specific field. */
const fieldByCode: Record<string, keyof typeof emptyForm> = {
  incorrect_current_password: "currentPassword",
  password_unchanged: "newPassword",
  weak_password: "newPassword",
};

interface ChangePasswordFormProps {
  submitLabel?: string;
  /** Called with the updated user once the API accepts the new password. */
  onChanged?: (user: SessionUser) => void;
}

/** Current, new and confirm fields. Used on the forced change page and the profile page. */
export function ChangePasswordForm({
  submitLabel = "Change password",
  onChanged,
}: ChangePasswordFormProps) {
  const { token, updateUser } = useAuth();
  const { values, submitting, setValues, field, submit } = useFormState(emptyForm);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    await submit(
      changePasswordFormSchema.safeParse(values),
      async ({ currentPassword, newPassword }) => {
        const user = await changePassword(token, { currentPassword, newPassword });
        setValues(emptyForm);
        updateUser(user);
        onChanged?.(user);
      },
      { title: "Couldn't change your password", fieldByCode },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <TextInputField
        label="Current password"
        type="password"
        autoComplete="current-password"
        {...field("currentPassword")}
      />
      <TextInputField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        {...field("newPassword")}
      />
      <TextInputField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        {...field("confirmPassword")}
      />
      <Button type="submit" loading={submitting} className="mt-2">
        {submitLabel}
      </Button>
    </form>
  );
}
