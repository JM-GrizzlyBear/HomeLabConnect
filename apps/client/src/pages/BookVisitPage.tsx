import {
  bookAppointmentRequestSchema,
  formatPeso,
  type LabProcedure,
} from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon, SearchIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { useNavigate } from "react-router";
import { AppointmentLines } from "@/components/appointments/AppointmentLines";
import { AvailabilityCalendar, SlotPicker } from "@/components/appointments/AvailabilityCalendar";
import { FormField } from "@/components/form/FormField";
import { TextInputField } from "@/components/form/TextInputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { bookAppointment, fetchAvailability, fetchQuote } from "../api/appointments";
import { fetchProcedures } from "../api/catalog";
import { fetchProfile } from "../api/profile";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { formatVisit } from "../format/appointments";
import { monthEnd, monthOf, shiftMonth } from "../format/schedule";
import { useFormState } from "../forms/useFormState";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

const steps = ["Tests", "Date & time", "Address & confirm"] as const;

/** A patient books a home visit in three steps: tests, a date and time, then the address. */
export function BookVisitPage() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [step, setStep] = useState(0);
  const [month, setMonth] = useState(() => monthOf());
  const [search, setSearch] = useState("");
  const form = useFormState({
    procedureIds: [] as string[],
    date: "",
    slot: "",
    address: "",
    landmark: "",
    notes: "",
  });
  const { values, errors, submitting, setValues, submit } = form;

  const catalog = useApiQuery(
    queryKeys.procedures({ status: "active", q: search, pageSize: 100 }),
    async (signal) =>
      await fetchProcedures({ status: "active", q: search || undefined, pageSize: 100 }, signal),
    { errorMessage: "Could not load the tests. Try again." },
  );
  const quote = useApiQuery(
    queryKeys.quote(values.procedureIds),
    async (signal) => await fetchQuote(values.procedureIds, signal),
    { enabled: values.procedureIds.length > 0 },
  );
  const availability = useApiQuery(
    queryKeys.availability(month, monthEnd(month)),
    async (signal) => await fetchAvailability(month, monthEnd(month), signal),
    { enabled: step >= 1, errorMessage: "Could not load the open days. Try again." },
  );
  const profile = useApiQuery(queryKeys.profile, fetchProfile);
  const selectedDay = availability.data?.find((day) => day.date === values.date) ?? null;

  function toggleProcedure(procedure: LabProcedure) {
    const picked = values.procedureIds.includes(procedure.id);
    setValues({
      procedureIds: picked
        ? values.procedureIds.filter((id) => id !== procedure.id)
        : [...values.procedureIds, procedure.id],
    });
  }

  function goTo(next: number) {
    // The address starts as the one on the profile; the patient can change it for this visit
    if (next === 2 && !values.address) {
      setValues({ address: profile.data?.patient?.address ?? "" });
    }
    setStep(next);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = bookAppointmentRequestSchema.safeParse({
      ...values,
      landmark: values.landmark.trim() || null,
      notes: values.notes.trim() || null,
    });
    await submit(
      parsed,
      async (request) => {
        const booked = await bookAppointment(request);
        feedback.success({
          title: "Visit booked",
          description:
            booked.status === "confirmed"
              ? `${booked.code} is confirmed.`
              : `${booked.code} is waiting for our team to confirm it.`,
        });
        navigate(`/app/appointments/${booked.id}`);
      },
      {
        title: "Couldn't book the visit",
        fieldByCode: {
          slot_full: "slot",
          slot_not_bookable: "slot",
          invalid_booking: "procedureIds",
        },
      },
    );
    availability.reload();
  }

  return (
    <>
      <PageHeader title="Book a Visit" />
      <ol className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Steps">
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={
              index === step
                ? "rounded-full bg-brand-600 px-3 py-1 font-medium text-white"
                : "rounded-full bg-slate-100 px-3 py-1 text-muted-foreground"
            }
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {step === 0 && (
            <ContentCard title="Choose your tests">
              <TextInputField
                label="Search tests"
                hideLabel
                placeholder="Search by name or code"
                icon={<SearchIcon />}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {catalog.error ? (
                <Alert variant="destructive" className="mt-4">
                  <CircleAlertIcon />
                  <AlertDescription>{catalog.error}</AlertDescription>
                </Alert>
              ) : !catalog.data ? (
                <Skeleton className="mt-4 h-40" aria-label="Loading tests" />
              ) : (
                <ul className="mt-4 divide-y" aria-label="Tests">
                  {catalog.data.items.map((procedure) => (
                    <li key={procedure.id}>
                      <label className="flex cursor-pointer items-center gap-3 py-2.5">
                        <Checkbox
                          checked={values.procedureIds.includes(procedure.id)}
                          onCheckedChange={() => toggleProcedure(procedure)}
                        />
                        <span className="flex-1">
                          <span className="font-medium">{procedure.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {procedure.code}
                          </span>
                        </span>
                        <span className="text-sm whitespace-nowrap">
                          {procedure.promotion ? (
                            <>
                              <span className="mr-1.5 text-xs text-muted-foreground line-through">
                                {formatPeso(procedure.priceCentavos)}
                              </span>
                              {formatPeso(procedure.promotion.discountedPriceCentavos)}
                            </>
                          ) : (
                            formatPeso(procedure.priceCentavos)
                          )}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex justify-end">
                <Button disabled={values.procedureIds.length === 0} onClick={() => goTo(1)}>
                  Next: date & time
                  <ChevronRightIcon />
                </Button>
              </div>
            </ContentCard>
          )}

          {step === 1 && (
            <ContentCard title="Pick a date and time">
              <div className="mb-3 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Previous month"
                  disabled={month <= monthOf()}
                  onClick={() => setMonth(shiftMonth(month, -1))}
                >
                  <ChevronLeftIcon />
                </Button>
                <span className="font-medium">{format(parseISO(month), "MMMM yyyy")}</span>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Next month"
                  onClick={() => setMonth(shiftMonth(month, 1))}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
              {availability.error ? (
                <Alert variant="destructive">
                  <CircleAlertIcon />
                  <AlertDescription>{availability.error}</AlertDescription>
                </Alert>
              ) : (
                <AvailabilityCalendar
                  month={month}
                  days={availability.data}
                  selected={values.date || null}
                  onSelect={(date) => setValues({ date, slot: "" })}
                />
              )}
              {selectedDay && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-medium">
                    Times on {format(parseISO(selectedDay.date), "EEEE, MMMM d")}
                  </p>
                  <SlotPicker
                    day={selectedDay}
                    selected={values.slot || null}
                    onSelect={(slot) => setValues({ slot })}
                  />
                </div>
              )}
              <div className="mt-5 flex justify-between">
                <Button variant="outline" onClick={() => goTo(0)}>
                  <ChevronLeftIcon />
                  Back
                </Button>
                <Button disabled={!values.date || !values.slot} onClick={() => goTo(2)}>
                  Next: address
                  <ChevronRightIcon />
                </Button>
              </div>
            </ContentCard>
          )}

          {step === 2 && (
            <ContentCard title="Where should we visit?">
              <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
                <FormField label="Address" error={errors.address}>
                  {(control) => (
                    <Textarea
                      {...control}
                      rows={2}
                      value={values.address}
                      onChange={(event) => setValues({ address: event.target.value })}
                    />
                  )}
                </FormField>
                <TextInputField
                  label="Landmark"
                  required={false}
                  placeholder="e.g. Blue gate, beside the chapel"
                  {...form.field("landmark")}
                />
                <FormField label="Notes for the team" optional error={errors.notes}>
                  {(control) => (
                    <Textarea
                      {...control}
                      rows={2}
                      placeholder="e.g. Please call when you arrive."
                      value={values.notes}
                      onChange={(event) => setValues({ notes: event.target.value })}
                    />
                  )}
                </FormField>
                {(errors.slot || errors.procedureIds) && (
                  <Alert variant="destructive">
                    <CircleAlertIcon />
                    <AlertDescription>{errors.slot ?? errors.procedureIds}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => goTo(1)}>
                    <ChevronLeftIcon />
                    Back
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Book visit
                  </Button>
                </div>
              </form>
            </ContentCard>
          )}
        </div>

        <ContentCard title="Your visit" className="lg:col-span-2">
          {values.date && values.slot && (
            <p className="mb-3 text-sm">
              <span className="text-muted-foreground">When: </span>
              <span className="font-medium">{formatVisit(values.date, values.slot)}</span>
            </p>
          )}
          {values.procedureIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tests chosen yet.</p>
          ) : quote.data ? (
            <AppointmentLines {...quote.data} />
          ) : (
            <Skeleton className="h-24" aria-label="Loading prices" />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            You pay online or in cash when the team arrives.
          </p>
        </ContentCard>
      </div>
    </>
  );
}
