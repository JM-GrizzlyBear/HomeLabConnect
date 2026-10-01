import {
  type BookingApproval,
  type SettingsResponse,
  systemSettingsSchema,
  type TeamAssignment,
} from "@homelabconnect/shared";
import { CircleAlertIcon } from "lucide-react";
import { type SubmitEvent, useId } from "react";
import { Link } from "react-router";
import { RadioGroupField } from "@/components/form/RadioGroupField";
import { SelectInputField } from "@/components/form/SelectInputField";
import { TextInputField } from "@/components/form/TextInputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchClosedDays, fetchSettings, saveSettings } from "../api/settings";
import { useApiData } from "../api/useApiData";
import { useAuth } from "../auth/authContext";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { formatDateTime } from "../format/dates";
import { timeOptions, weekdays } from "../format/settings";
import { useFormState } from "../forms/useFormState";

/** Numbers are typed as text and converted on save. Keys match the request schema. */
interface FormValues {
  visitDays: number[];
  visitStart: string;
  visitEnd: string;
  slotMinutes: string;
  minNoticeHours: string;
  bookingWindowDays: string;
  cancelCutoffHours: string;
  visitsPerTeamPerDay: string;
  bookingApproval: BookingApproval;
  teamAssignment: TeamAssignment;
}

function toFormValues({ settings }: SettingsResponse): FormValues {
  return {
    ...settings,
    slotMinutes: String(settings.slotMinutes),
    minNoticeHours: String(settings.minNoticeHours),
    bookingWindowDays: String(settings.bookingWindowDays),
    cancelCutoffHours: String(settings.cancelCutoffHours),
    visitsPerTeamPerDay: String(settings.visitsPerTeamPerDay),
  };
}

/** "" → NaN, so the schema reports the field as missing rather than 0. */
const toNumber = (text: string) => (text.trim() === "" ? Number.NaN : Number(text));

const slotOptions = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1½ hours" },
];
const approvalOptions = [
  {
    value: "staff",
    label: "Staff accepts each booking",
    hint: "Support or admin reviews a new booking before it's confirmed.",
  },
  {
    value: "automatic",
    label: "Confirm automatically",
    hint: "A booking on an open slot is confirmed straight away.",
  },
];
const assignmentOptions = [
  { value: "manual", label: "Assign manually", hint: "Staff picks the med team for each visit." },
  {
    value: "auto",
    label: "Auto-assign",
    hint: "The team on shift with the fewest visits that day gets it.",
  },
];

/** Booking and assignment rules. Everyone with settings.view sees them; settings.manage edits. */
export function SettingsPage() {
  const { data, error, reload } = useApiData(fetchSettings, [], {
    errorMessage: "Could not load the settings. Try again.",
  });

  return (
    <>
      <PageHeader title="Settings" />
      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data ? (
        // Keyed by the save time so a reload after saving starts from the stored values.
        <SettingsForm key={data.updatedAt ?? "defaults"} response={data} onSaved={reload} />
      ) : (
        <div className="grid max-w-3xl gap-6" aria-label="Loading the settings">
          <Skeleton className="h-72" />
          <Skeleton className="h-40" />
        </div>
      )}
    </>
  );
}

function SettingsForm({ response, onSaved }: { response: SettingsResponse; onSaved(): void }) {
  const { token } = useAuth();
  const feedback = useFeedback();
  const can = useCan();
  const canManage = can("settings.manage");
  const readOnly = !canManage;
  const daysId = useId();
  const { values, errors, submitting, set, setValues, field, submit } = useFormState(() =>
    toFormValues(response),
  );
  const closedDays = useApiData(
    (authToken, signal) => fetchClosedDays(authToken, new Date().getFullYear(), signal),
    [],
    { enabled: can("holidays.view") },
  );

  function toggleDay(day: number, on: boolean) {
    setValues({
      visitDays: on
        ? [...values.visitDays, day]
        : values.visitDays.filter((visitDay) => visitDay !== day),
    });
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const parsed = systemSettingsSchema.safeParse({
      ...values,
      slotMinutes: Number(values.slotMinutes),
      minNoticeHours: toNumber(values.minNoticeHours),
      bookingWindowDays: toNumber(values.bookingWindowDays),
      cancelCutoffHours: toNumber(values.cancelCutoffHours),
      visitsPerTeamPerDay: toNumber(values.visitsPerTeamPerDay),
    });
    await submit(
      parsed,
      async (settings) => {
        await saveSettings(token, settings);
        feedback.success({
          title: "Settings saved",
          description: "New bookings follow them from now on.",
        });
        onSaved();
      },
      { title: "Couldn't save the settings" },
    );
  }

  return (
    <form className="grid max-w-3xl gap-6" onSubmit={handleSubmit} noValidate>
      {readOnly && (
        <Alert>
          <CircleAlertIcon />
          <AlertDescription>You can view these settings but not change them.</AlertDescription>
        </Alert>
      )}

      <ContentCard title="Booking">
        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset className="grid gap-2 sm:col-span-2" aria-describedby={`${daysId}-hint`}>
            <legend className="mb-2 text-sm font-medium text-slate-700">Visit days</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {weekdays.map((day) => (
                <div key={day.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`${daysId}-${day.value}`}
                    checked={values.visitDays.includes(day.value)}
                    onCheckedChange={(checked) => toggleDay(day.value, checked === true)}
                    disabled={readOnly}
                    aria-label={day.label}
                  />
                  <Label htmlFor={`${daysId}-${day.value}`} className="font-normal">
                    {day.short}
                  </Label>
                </div>
              ))}
            </div>
            {errors.visitDays ? (
              <FieldError role={undefined}>{errors.visitDays}</FieldError>
            ) : (
              <p id={`${daysId}-hint`} className="text-xs text-muted-foreground">
                Holidays and special days off are closed on top of this.{" "}
                {closedDays.data && (
                  <>
                    {closedDays.data.length} set up for {new Date().getFullYear()}.{" "}
                    <Link
                      to="/app/scheduling/holidays"
                      className="font-medium text-brand-700 hover:underline"
                    >
                      Manage closed days
                    </Link>
                  </>
                )}
              </p>
            )}
          </fieldset>
          <SelectInputField
            label="Visits start at"
            options={timeOptions}
            value={values.visitStart}
            onValueChange={set("visitStart")}
            disabled={readOnly}
            error={errors.visitStart}
          />
          <SelectInputField
            label="Last visit ends by"
            options={timeOptions}
            value={values.visitEnd}
            onValueChange={set("visitEnd")}
            disabled={readOnly}
            error={errors.visitEnd}
          />
          <SelectInputField
            label="Time slot length"
            options={slotOptions}
            value={values.slotMinutes}
            onValueChange={set("slotMinutes")}
            disabled={readOnly}
            error={errors.slotMinutes}
          />
          <TextInputField
            label="Booking window (days ahead)"
            type="number"
            min={1}
            max={180}
            disabled={readOnly}
            hint="How far ahead patients can book."
            {...field("bookingWindowDays")}
          />
          <TextInputField
            label="Minimum notice (hours)"
            type="number"
            min={0}
            max={168}
            disabled={readOnly}
            hint="How long before a visit it must be booked."
            {...field("minNoticeHours")}
          />
          <TextInputField
            label="Patients can cancel until (hours before)"
            type="number"
            min={0}
            max={168}
            disabled={readOnly}
            {...field("cancelCutoffHours")}
          />
        </div>
      </ContentCard>

      <ContentCard title="Capacity">
        <TextInputField
          label="Visits per med team per day"
          type="number"
          min={1}
          max={50}
          disabled={readOnly}
          hint="Used once med teams are set up in Scheduling."
          className="sm:max-w-xs"
          {...field("visitsPerTeamPerDay")}
        />
      </ContentCard>

      <ContentCard title="Assignment">
        <div className="grid gap-6 sm:grid-cols-2">
          <RadioGroupField
            label="New bookings"
            options={approvalOptions}
            value={values.bookingApproval}
            onValueChange={(bookingApproval) =>
              setValues({ bookingApproval: bookingApproval as BookingApproval })
            }
            disabled={readOnly}
          />
          <RadioGroupField
            label="Team assignment"
            options={assignmentOptions}
            value={values.teamAssignment}
            onValueChange={(teamAssignment) =>
              setValues({ teamAssignment: teamAssignment as TeamAssignment })
            }
            disabled={readOnly}
          />
        </div>
      </ContentCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {response.updatedAt
            ? `Last changed by ${response.updatedBy ?? "a removed user"} on ${formatDateTime(response.updatedAt)}.`
            : "Using the default settings."}
        </p>
        {canManage && (
          <Button type="submit" loading={submitting}>
            Save settings
          </Button>
        )}
      </div>
    </form>
  );
}
