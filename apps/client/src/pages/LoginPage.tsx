import { loginRequestSchema } from "@homelabconnect/shared";
import type { SubmitEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { useAuth } from "../auth/authContext";
import { AuthLayout } from "../components/AuthLayout";
import { LockIcon, MailIcon } from "../components/icons";
import { useFormState } from "../forms/useFormState";

interface LoginLocationState {
  from?: string;
  registeredEmail?: string;
}

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as LoginLocationState;
  const { values, submitting, field, submit } = useFormState({
    email: state.registeredEmail ?? "",
    password: "",
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit(
      loginRequestSchema.safeParse(values),
      async ({ email, password }) => {
        await signIn(email, password);
        navigate(state.from ?? "/app", { replace: true });
      },
      { title: "Couldn't sign you in" },
    );
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
          {...field("email")}
        />
        <TextInputField
          label="Password"
          hideLabel
          size="lg"
          icon={<LockIcon />}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          {...field("password")}
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
