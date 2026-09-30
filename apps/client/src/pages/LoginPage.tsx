import { loginRequestSchema } from "@homelabconnect/shared";
import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { useAuth } from "../auth/authContext";
import { AuthLayout } from "../components/AuthLayout";
import { LockIcon, MailIcon } from "../components/icons";
import { useFeedback } from "../feedback/feedbackContext";
import { toFieldErrors } from "../forms/fieldErrors";
import { handleSubmitError } from "../forms/submitErrors";

interface LoginLocationState {
  from?: string;
  registeredEmail?: string;
}

export function LoginPage() {
  const { signIn } = useAuth();
  const feedback = useFeedback();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as LoginLocationState;

  const [email, setEmail] = useState(state.registeredEmail ?? "");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = loginRequestSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      navigate(state.from ?? "/app", { replace: true });
    } catch (error) {
      setSubmitting(false);
      handleSubmitError(error, { title: "Couldn't sign you in", feedback, setFieldErrors });
    }
  }

  return (
    <AuthLayout
      title="Login"
      subtitle="Sign in to book home visits and view your lab results."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <TextInputField
          label="Email"
          hideLabel
          size="lg"
          icon={<MailIcon />}
          placeholder="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <TextInputField
          label="Password"
          hideLabel
          size="lg"
          icon={<LockIcon />}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <div className="flex justify-center pt-2">
          <Button type="submit" size="lg" loading={submitting} className="min-w-40">
            Login Now
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
