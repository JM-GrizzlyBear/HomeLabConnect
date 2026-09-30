import { registerPatientRequestSchema } from "@homelabconnect/shared";
import { format } from "date-fns";
import type { SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { DatePickerField } from "@/components/form/DatePicker";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { register } from "../api/auth";
import { AuthLayout } from "../components/AuthLayout";
import { useFeedback } from "../feedback/feedbackContext";
import { useFormState } from "../forms/useFormState";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  birthDate: "",
  address: "",
};

export function RegisterPage() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const { values, errors, submitting, set, field, submit } = useFormState(emptyForm);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = registerPatientRequestSchema.safeParse({
      ...values,
      // Optional fields are omitted rather than sent empty.
      birthDate: values.birthDate || undefined,
      address: values.address.trim() || undefined,
    });
    await submit(
      parsed,
      async (request) => {
        const user = await register(request);
        feedback.success({
          title: "Account created",
          description: `Welcome, ${user.firstName}! Sign in with ${user.email} to continue.`,
        });
        navigate("/login", { state: { registeredEmail: user.email } });
      },
      { title: "Couldn't create your account", fieldByCode: { email_taken: "email" } },
    );
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
          error={errors.birthDate}
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
