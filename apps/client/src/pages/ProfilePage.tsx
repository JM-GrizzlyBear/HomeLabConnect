import { type Profile, updateProfileRequestSchema } from "@homelabconnect/shared";
import { type FormEvent, useEffect, useState } from "react";
import { ApiError } from "../api/apiClient";
import { fetchProfile, updateProfile } from "../api/profile";
import { useAuth } from "../auth/authContext";
import { roleLabels } from "../auth/roleLabels";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/layout/PageHeader";
import { TextField } from "../components/TextField";
import { ChangePasswordForm } from "../forms/ChangePasswordForm";
import { toFieldErrors } from "../forms/fieldErrors";

interface FormValues {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  address: string;
}

function toFormValues(profile: Profile): FormValues {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone ?? "",
    birthDate: profile.patient?.birthDate ?? "",
    address: profile.patient?.address ?? "",
  };
}

/** Where each form field's errors come from: the request path, or an API error code. */
const errorKeys: Record<keyof FormValues, string> = {
  firstName: "firstName",
  lastName: "lastName",
  phone: "phone",
  birthDate: "patient.birthDate",
  address: "patient.address",
};
const fieldByCode: Record<string, string> = { phone_required: "phone" };

export function ProfilePage() {
  const { token, user, updateUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchProfile(token, controller.signal)
      .then(setProfile)
      .catch(() => {
        if (!controller.signal.aborted) setLoadError("Could not load your profile. Try again.");
      });
    return () => controller.abort();
  }, [token]);

  if (!user) return null;

  return (
    <>
      <PageHeader title="Account Profile" />
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Card title="Personal details" className="lg:col-span-3">
          {loadError ? (
            <Alert tone="error">{loadError}</Alert>
          ) : profile ? (
            <ProfileForm
              profile={profile}
              onSaved={(saved) => {
                setProfile(saved);
                updateUser({ ...user, firstName: saved.firstName, lastName: saved.lastName });
              }}
            />
          ) : (
            <p className="text-sm text-slate-500">Loading your profile…</p>
          )}
        </Card>
        <Card title="Password" className="lg:col-span-2">
          <PasswordSection />
        </Card>
      </div>
    </>
  );
}

function ProfileForm({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (profile: Profile) => void;
}) {
  const { token } = useAuth();
  const isPatient = profile.role === "patient";
  const [values, setValues] = useState<FormValues>(() => toFormValues(profile));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const field = (name: keyof FormValues) => ({
    name,
    value: values[name],
    onChange: (e: { target: { value: string } }) => {
      setSaved(false);
      setValues((current) => ({ ...current, [name]: e.target.value }));
    },
    error: fieldErrors[errorKeys[name]],
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    const parsed = updateProfileRequestSchema.safeParse({
      firstName: values.firstName,
      lastName: values.lastName,
      // Cleared fields are sent as null so the API removes them.
      phone: values.phone.trim() || null,
      patient: isPatient
        ? { birthDate: values.birthDate || null, address: values.address.trim() || null }
        : undefined,
    });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});
    if (!token) return;

    setSubmitting(true);
    try {
      const updated = await updateProfile(token, parsed.data);
      setValues(toFormValues(updated));
      setSaved(true);
      onSaved(updated);
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
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
      {(formError || saved) && (
        <div className="sm:col-span-2">
          {formError ? (
            <Alert tone="error">{formError}</Alert>
          ) : (
            <Alert tone="success">Your profile has been saved.</Alert>
          )}
        </div>
      )}
      <TextField
        label="Email"
        type="email"
        value={profile.email}
        readOnly
        hint={`${roleLabels[profile.role]} account. Your sign-in email can't be changed here.`}
        className="sm:col-span-2"
      />
      <TextField label="First name" autoComplete="given-name" {...field("firstName")} />
      <TextField label="Last name" autoComplete="family-name" {...field("lastName")} />
      <TextField
        label="Mobile number"
        type="tel"
        autoComplete="tel"
        required={isPatient}
        {...field("phone")}
      />
      {isPatient && (
        <>
          <TextField label="Birth date" type="date" required={false} {...field("birthDate")} />
          <TextField
            label="Home address"
            autoComplete="street-address"
            required={false}
            hint="Where the med team will collect samples."
            className="sm:col-span-2"
            {...field("address")}
          />
        </>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" loading={submitting} className="mt-2">
          Save changes
        </Button>
      </div>
    </form>
  );
}

function PasswordSection() {
  const [changed, setChanged] = useState(false);

  return (
    <div className="grid gap-4">
      {changed && (
        <Alert tone="success">
          Password changed. Other devices signed in to your account have been logged out.
        </Alert>
      )}
      <ChangePasswordForm onChanged={() => setChanged(true)} />
    </div>
  );
}
