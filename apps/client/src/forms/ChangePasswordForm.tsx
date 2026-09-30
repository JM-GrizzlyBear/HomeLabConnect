import { changePasswordFormSchema, type CurrentUser } from "@homelabconnect/shared";
import { type FormEvent, useState } from "react";
import { ApiError } from "../api/apiClient";
import { changePassword } from "../api/auth";
import { useAuth } from "../auth/authContext";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { toFieldErrors } from "./fieldErrors";

const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

type FormValues = typeof emptyForm;

/** Errors the API reports about one specific field. */
const fieldByCode: Record<string, keyof FormValues> = {
  incorrect_current_password: "currentPassword",
  password_unchanged: "newPassword",
  weak_password: "newPassword",
};

interface ChangePasswordFormProps {
  submitLabel?: string;
  /** Called with the updated user once the API accepts the new password. */
  onChanged?: (user: CurrentUser) => void;
}

/** Current, new and confirm fields. Used on the forced change page and the profile page. */
export function ChangePasswordForm({
  submitLabel = "Change password",
  onChanged,
}: ChangePasswordFormProps) {
  const { token, updateUser } = useAuth();
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const field = (name: keyof FormValues) => ({
    name,
    value: values[name],
    onChange: (e: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [name]: e.target.value })),
    error: fieldErrors[name],
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = changePasswordFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});
    if (!token) return;

    setSubmitting(true);
    try {
      const { currentPassword, newPassword } = parsed.data;
      const user = await changePassword(token, { currentPassword, newPassword });
      setValues(emptyForm);
      updateUser(user);
      onChanged?.(user);
    } catch (error) {
      const codeField = error instanceof ApiError ? fieldByCode[error.code] : undefined;
      if (!(error instanceof ApiError)) {
        setFormError("Could not reach the server. Try again.");
      } else if (codeField) {
        setFieldErrors({ [codeField]: error.message });
      } else if (error.issues.length > 0) {
        setFieldErrors(toFieldErrors(error.issues));
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        {...field("currentPassword")}
      />
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        {...field("newPassword")}
      />
      <TextField
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
