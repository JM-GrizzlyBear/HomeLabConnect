import { registerPatientRequestSchema } from "@homelabconnect/shared";
import { format } from "date-fns";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { DatePickerField } from "@/components/form/DatePicker";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { register } from "../api/auth";
import { AuthLayout } from "../components/AuthLayout";
import { useFeedback } from "../feedback/feedbackContext";
import { toFieldErrors } from "../forms/fieldErrors";
import { handleSubmitError } from "../forms/submitErrors";

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
  const feedback = useFeedback();
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (name: keyof FormValues) => (value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const field = (name: keyof FormValues) => ({
    name,
    value: values[name],
    onChange: (e: { target: { value: string } }) => set(name)(e.target.value),
    error: fieldErrors[name],
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      feedback.success({
        title: "Account created",
        description: `Welcome, ${user.firstName}! Sign in with ${user.email} to continue.`,
      });
      navigate("/login", { state: { registeredEmail: user.email } });
    } catch (error) {
      setSubmitting(false);
      handleSubmitError(error, {
        title: "Couldn't create your account",
        feedback,
        setFieldErrors,
        fieldByCode: { email_taken: "email" },
      });
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
        <TextInputField label="First name" autoComplete="given-name" {...field("firstName")} />
        <TextInputField label="Last name" autoComplete="family-name" {...field("lastName")} />
        <TextInputField
          label="Email"
          type="email"
          autoComplete="email"
          className="sm:col-span-2"
          {...field("email")}
        />
        <TextInputField label="Mobile number" type="tel" autoComplete="tel" {...field("phone")} />
        <DatePickerField
          label="Birth date"
          required={false}
          value={values.birthDate}
          onChange={set("birthDate")}
          max={format(new Date(), "yyyy-MM-dd")}
          error={fieldErrors.birthDate}
        />
        <TextInputField
          label="Home address"
          autoComplete="street-address"
          required={false}
          hint="Where the med team will collect samples. You can add it later."
          className="sm:col-span-2"
          {...field("address")}
        />
        <TextInputField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          className="sm:col-span-2"
          {...field("password")}
        />
        <Button type="submit" size="lg" loading={submitting} className="mt-2 sm:col-span-2">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
