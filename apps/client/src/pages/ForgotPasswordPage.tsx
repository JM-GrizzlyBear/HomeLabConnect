import { forgotPasswordRequestSchema } from "@homelabconnect/shared";
import { type SubmitEvent, useState } from "react";
import { Link } from "react-router";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "../api/auth";
import { AuthLayout } from "../components/AuthLayout";
import { MailIcon } from "../components/icons";
import { useFormState } from "../forms/useFormState";

/** "Forgot password?": asks for the email, then says the same thing whether or not it exists. */
export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { values, submitting, field, submit } = useFormState({ email: "" });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit(
      forgotPasswordRequestSchema.safeParse(values),
      async ({ email }) => {
        await requestPasswordReset(email);
        setSentTo(email);
      },
      { title: "Couldn't send the link" },
    );
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="We'll email you a link to choose a new one."
      footer={
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Back to login
        </Link>
      }
    >
      {sentTo ? (
        <div role="status" className="space-y-2 text-center text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Check your email</p>
          <p>If {sentTo} has an account, we sent a link to it. It works once, for the next hour.</p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <TextInputField
            label="Email"
            hideLabel
            size="lg"
            icon={<MailIcon />}
            placeholder="Email address"
            type="email"
            autoComplete="email"
            autoFocus
            {...field("email")}
          />
          <div className="flex justify-center pt-2">
            <Button type="submit" size="lg" loading={submitting} className="min-w-40">
              Send link
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
