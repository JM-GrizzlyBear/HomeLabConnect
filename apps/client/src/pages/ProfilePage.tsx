import { type Profile, updateProfileRequestSchema } from "@homelabconnect/shared";
import { format } from "date-fns";
import { CircleAlertIcon } from "lucide-react";
import type { SubmitEvent } from "react";
import { DatePickerField } from "@/components/form/DatePicker";
import { TextInputField } from "@/components/form/TextInputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProfile, updateProfile } from "../api/profile";
import { useApiData } from "../api/useApiData";
import { useAuth } from "../auth/authContext";
import { roleLabels } from "../auth/roleLabels";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { ChangePasswordForm } from "../forms/ChangePasswordForm";
import { useFormState } from "../forms/useFormState";

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
  const { user, updateUser } = useAuth();
  const feedback = useFeedback();
  const { data: profile, error: loadError } = useApiData(fetchProfile, [], {
    errorMessage: "Could not load your profile. Try again.",
  });

  if (!user) return null;

  return (
    <>
      <PageHeader title="Account Profile" />
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <ContentCard title="Personal details" className="lg:col-span-3">
          {loadError ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          ) : profile ? (
            <ProfileForm
              profile={profile}
              onSaved={(saved) =>
                updateUser({ ...user, firstName: saved.firstName, lastName: saved.lastName })
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2" aria-label="Loading your profile">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          )}
        </ContentCard>
        <ContentCard title="Password" className="lg:col-span-2">
          <ChangePasswordForm
            onChanged={() =>
              feedback.success({
                title: "Password changed",
                description: "Other devices signed in to your account have been logged out.",
              })
            }
          />
        </ContentCard>
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
  const feedback = useFeedback();
  const isPatient = profile.role === "patient";
  const form = useFormState(() => toFormValues(profile));
  const { values, errors, submitting, set, submit } = form;
  const field = (name: keyof FormValues) => form.field(name, errorKeys[name]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const parsed = updateProfileRequestSchema.safeParse({
      firstName: values.firstName,
      lastName: values.lastName,
      // Cleared fields are sent as null so the API removes them.
      phone: values.phone.trim() || null,
      patient: isPatient
        ? { birthDate: values.birthDate || null, address: values.address.trim() || null }
        : undefined,
    });
    await submit(
      parsed,
      async (request) => {
        const updated = await updateProfile(token, request);
        form.setValues(toFormValues(updated));
        onSaved(updated);
        feedback.success({ title: "Profile saved", description: "Your details are up to date." });
      },
      { title: "Couldn't save your profile", fieldByCode },
    );
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
      <TextInputField
        label="Email"
        type="email"
        value={profile.email}
        readOnly
        hint={`${roleLabels[profile.role]} account. Your sign-in email can't be changed here.`}
        className="sm:col-span-2"
      />
      <TextInputField label="First name" autoComplete="given-name" {...field("firstName")} />
      <TextInputField label="Last name" autoComplete="family-name" {...field("lastName")} />
      <TextInputField
        label="Mobile number"
        type="tel"
        autoComplete="tel"
        required={isPatient}
        {...field("phone")}
      />
      {isPatient && (
        <>
          <DatePickerField
            label="Birth date"
            required={false}
            value={values.birthDate}
            onChange={set("birthDate")}
            max={format(new Date(), "yyyy-MM-dd")}
            error={errors[errorKeys.birthDate]}
          />
          <TextInputField
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
