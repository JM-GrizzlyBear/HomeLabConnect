import { resetPasswordFormSchema } from "@homelabconnect/shared";
import type { SubmitEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { resetPassword } from "../api/auth";
import { AuthLayout } from "../components/AuthLayout";
import { LockIcon } from "../components/icons";
import { useFeedback } from "../feedback/feedbackContext";
import { useFormState } from "../forms/useFormState";

/** Opened from the reset email: choose a new password, then sign in with it. */
export function ResetPasswordPage() {
  const token = useSearchParams()[0].get("token") ?? "";
  const navigate = useNavigate();
  const feedback = useFeedback();
  const { values, submitting, field, submit } = useFormState({
    newPassword: "",
    confirmPassword: "",
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit(
      resetPasswordFormSchema.safeParse(values),
      async ({ newPassword }) => {
        await resetPassword(token, newPassword);
        feedback.success({ title: "Password changed. Sign in with it." });
        navigate("/login", { replace: true });
      },
      { title: "Couldn't change your password", fieldByCode: { weak_password: "newPassword" } },
    );
  }

  return (
    <AuthLayout
      title="New password"
      subtitle="At least 8 characters, with a letter and a number."
      footer={
        <Link to="/forgot-password" className="font-semibold text-brand-700 hover:underline">
          Send a new link
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <TextInputField
          label="New password"
          hideLabel
          size="lg"
          icon={<LockIcon />}
          placeholder="New password"
          type="password"
          autoComplete="new-password"
          {...field("newPassword")}
        />
        <TextInputField
          label="Confirm new password"
          hideLabel
          size="lg"
          icon={<LockIcon />}
          placeholder="Confirm new password"
          type="password"
          autoComplete="new-password"
          {...field("confirmPassword")}
        />
        <div className="flex justify-center pt-2">
          <Button type="submit" size="lg" loading={submitting} className="min-w-40">
            Save password
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
