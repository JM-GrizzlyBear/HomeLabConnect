import { loginRequestSchema } from "@homelabconnect/shared";
import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ApiError } from "../api/apiClient";
import { useAuth } from "../auth/authContext";
import { Alert } from "../components/Alert";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { LockIcon, MailIcon } from "../components/icons";
import { TextField } from "../components/TextField";
import { toFieldErrors } from "../forms/fieldErrors";

interface LoginLocationState {
  from?: string;
  registeredEmail?: string;
}

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as LoginLocationState;

  const [email, setEmail] = useState(state.registeredEmail ?? "");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

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
      setFormError(
        error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      );
      setSubmitting(false);
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
        {state.registeredEmail && !formError && (
          <Alert tone="success">Account created. Sign in to continue.</Alert>
        )}
        {formError && <Alert tone="error">{formError}</Alert>}
        <TextField
          label="Email"
          hideLabel
          icon={<MailIcon />}
          placeholder="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <TextField
          label="Password"
          hideLabel
          icon={<LockIcon />}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <div className="flex justify-center pt-2">
          <Button type="submit" loading={submitting} className="min-w-40">
            Login Now
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
