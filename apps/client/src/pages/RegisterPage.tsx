import { registerPatientRequestSchema } from "@homelabconnect/shared";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError } from "../api/apiClient";
import { register } from "../api/auth";
import { Alert } from "../components/Alert";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { toFieldErrors } from "../forms/fieldErrors";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  birthDate: "",
  address: "",
};

type FormValues = typeof emptyForm;

export function RegisterPage() {
  const navigate = useNavigate();
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

    const parsed = registerPatientRequestSchema.safeParse({
      ...values,
      // Optional fields are omitted rather than sent empty.
      birthDate: values.birthDate || undefined,
      address: values.address.trim() || undefined,
    });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const user = await register(parsed.data);
      navigate("/login", { state: { registeredEmail: user.email } });
    } catch (error) {
      setSubmitting(false);
      if (!(error instanceof ApiError)) {
        setFormError("Could not reach the server. Try again.");
      } else if (error.code === "email_taken") {
        setFieldErrors({ email: error.message });
      } else if (error.issues.length > 0) {
        setFieldErrors(toFieldErrors(error.issues));
      } else {
        setFormError(error.message);
      }
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Book home lab visits and see your results online."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="sm:col-span-2">
            <Alert tone="error">{formError}</Alert>
          </div>
        )}
        <TextField label="First name" autoComplete="given-name" {...field("firstName")} />
        <TextField label="Last name" autoComplete="family-name" {...field("lastName")} />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          className="sm:col-span-2"
          {...field("email")}
        />
        <TextField label="Mobile number" type="tel" autoComplete="tel" {...field("phone")} />
        <TextField label="Birth date" type="date" required={false} {...field("birthDate")} />
        <TextField
          label="Home address"
          autoComplete="street-address"
          required={false}
          hint="Where the med team will collect samples. You can add it later."
          className="sm:col-span-2"
          {...field("address")}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          className="sm:col-span-2"
          {...field("password")}
        />
        <Button type="submit" loading={submitting} className="mt-2 sm:col-span-2">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
