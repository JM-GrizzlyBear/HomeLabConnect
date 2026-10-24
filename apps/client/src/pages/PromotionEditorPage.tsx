import {
  type DiscountType,
  type LabProcedure,
  type PromotionScope,
  promotionRequestSchema,
} from "@homelabconnect/shared";
import { CircleAlertIcon } from "lucide-react";
import type { SubmitEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ProcedurePicker } from "@/components/catalog/ProcedurePicker";
import { DatePickerField } from "@/components/form/DatePicker";
import { FormField } from "@/components/form/FormField";
import { RadioGroupField } from "@/components/form/RadioGroupField";
import { TextInputField } from "@/components/form/TextInputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { createPromotion, fetchProcedures, fetchPromotion, updatePromotion } from "../api/catalog";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import {
  centavosToPesos,
  discountedPriceCentavos,
  formatPeso,
  pesosToCentavos,
} from "../format/catalog";
import { useFormState } from "../forms/useFormState";

/** Every field as typed; the discount is converted on submit. Keys match the request schema. */
interface FormValues {
  name: string;
  description: string;
  discountType: DiscountType;
  /** A percent ("20") or pesos ("200.00"), depending on discountType. */
  value: string;
  startsOn: string;
  /** "date": ends on `endsOn`; "never": runs until switched off. */
  ends: Ends;
  endsOn: string;
  appliesTo: PromotionScope;
  procedureIds: string[];
}

type Ends = "date" | "never";

const emptyForm: FormValues = {
  name: "",
  description: "",
  discountType: "percent",
  value: "",
  startsOn: "",
  ends: "date",
  endsOn: "",
  appliesTo: "all",
  procedureIds: [],
};

const endsOptions = [
  { value: "date", label: "On a date" },
  { value: "never", label: "No end date", hint: "Runs until you turn it off, e.g. senior/PWD" },
];

const discountOptions = [
  { value: "percent", label: "Percent off", hint: "e.g. 20% off" },
  { value: "fixed", label: "Peso amount off", hint: "e.g. ₱200 off" },
];
const scopeOptions = [
  { value: "all", label: "All procedures" },
  { value: "selected", label: "Only the procedures I choose" },
];

/** How many example prices the preview shows. */
const PREVIEW_COUNT = 3;

/** The discount as the API expects it, or NaN so the schema reports it as missing. */
function discountValue(values: FormValues): number {
  if (values.discountType === "fixed") return pesosToCentavos(values.value) ?? Number.NaN;
  return values.value.trim() === "" ? Number.NaN : Number(values.value);
}

/** /app/catalog/promotions/new sets up a sale; /app/catalog/promotions/:id edits one. */
export function PromotionEditorPage() {
  const { id } = useParams();
  const title = id ? "Edit Promotion" : "New Promotion";
  const { data, error: loadError } = useApiQuery(
    queryKeys.promotion(id),
    async (signal) => {
      const [procedures, promotion] = await Promise.all([
        fetchProcedures({ status: "active", pageSize: 100 }, signal),
        id ? fetchPromotion(id, signal) : null,
      ]);
      const initialValues: FormValues = promotion
        ? {
            name: promotion.name,
            description: promotion.description ?? "",
            discountType: promotion.discountType,
            value:
              promotion.discountType === "fixed"
                ? centavosToPesos(promotion.value)
                : String(promotion.value),
            startsOn: promotion.startsOn,
            ends: promotion.endsOn === null ? "never" : "date",
            endsOn: promotion.endsOn ?? "",
            appliesTo: promotion.appliesTo,
            procedureIds: promotion.procedureIds,
          }
        : emptyForm;
      return { id, procedures: procedures.items, initialValues };
    },
    { errorMessage: "Could not load the promotion. Try again." },
  );

  if (loadError) {
    return (
      <>
        <PageHeader title={title} />
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </>
    );
  }
  // `data` still holds the previous promotion for a moment after moving to another one.
  if (!data || data.id !== id) {
    return (
      <>
        <PageHeader title={title} />
        <Skeleton className="h-120 max-w-3xl" aria-label="Loading the promotion" />
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} />
      <PromotionForm
        key={id}
        id={id}
        procedures={data.procedures}
        initialValues={data.initialValues}
      />
    </>
  );
}

interface PromotionFormProps {
  /** The promotion being edited; undefined when setting one up. */
  id: string | undefined;
  procedures: LabProcedure[];
  initialValues: FormValues;
}

function PromotionForm({ id, procedures, initialValues }: PromotionFormProps) {
  const feedback = useFeedback();
  const navigate = useNavigate();
  const { values, errors, submitting, set, setValues, field, submit } = useFormState(initialValues);

  const value = discountValue(values);
  const previewProcedures = (
    values.appliesTo === "selected"
      ? procedures.filter((procedure) => values.procedureIds.includes(procedure.id))
      : procedures
  ).slice(0, PREVIEW_COUNT);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = promotionRequestSchema.safeParse({
      name: values.name,
      description: values.description.trim() || null,
      discountType: values.discountType,
      value,
      startsOn: values.startsOn,
      endsOn: values.ends === "never" ? null : values.endsOn,
      appliesTo: values.appliesTo,
      procedureIds: values.appliesTo === "selected" ? values.procedureIds : [],
    });
    await submit(
      parsed,
      async (request) => {
        const saved = id ? await updatePromotion(id, request) : await createPromotion(request);
        feedback.success({
          title: id ? "Promotion saved" : "Promotion created",
          description: `${saved.name} is ${saved.status === "running" ? "running now" : saved.status}.`,
        });
        navigate("/app/catalog/promotions");
      },
      { title: "Couldn't save the promotion", fieldByCode: { promotion_name_taken: "name" } },
    );
  }

  return (
    <form className="grid max-w-3xl gap-6" onSubmit={handleSubmit} noValidate>
      <ContentCard title="Promotion">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInputField
            label="Name"
            placeholder="e.g. Senior & PWD Discount"
            autoComplete="off"
            className="sm:col-span-2"
            {...field("name")}
          />
          <FormField
            label="Description"
            optional
            error={errors.description}
            className="sm:col-span-2"
          >
            {(control) => (
              <Textarea
                {...control}
                name="description"
                placeholder="Who it's for, or any conditions."
                value={values.description}
                onChange={(e) => set("description")(e.target.value)}
              />
            )}
          </FormField>
          <DatePickerField
            label="First day"
            value={values.startsOn}
            onChange={set("startsOn")}
            error={errors.startsOn}
            className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]"
          />
          <RadioGroupField
            label="Ends"
            options={endsOptions}
            value={values.ends}
            onValueChange={(ends) => setValues({ ends: ends as Ends })}
          />
          {values.ends === "date" && (
            <DatePickerField
              label="Last day"
              value={values.endsOn}
              onChange={set("endsOn")}
              min={values.startsOn || undefined}
              hint="The sale ends at midnight after this day."
              error={errors.endsOn}
            />
          )}
        </div>
      </ContentCard>

      <ContentCard title="Discount">
        <div className="grid gap-4 sm:grid-cols-2">
          <RadioGroupField
            label="Kind of discount"
            options={discountOptions}
            value={values.discountType}
            // The number means something different now, so start it over.
            onValueChange={(discountType) =>
              setValues({ discountType: discountType as DiscountType, value: "" })
            }
          />
          <TextInputField
            label={values.discountType === "percent" ? "Percent off" : "Amount off"}
            inputMode="decimal"
            placeholder={values.discountType === "percent" ? "20" : "200.00"}
            icon={
              <span className="text-sm font-medium">
                {values.discountType === "percent" ? "%" : "₱"}
              </span>
            }
            {...field("value")}
          />
        </div>
        {previewProcedures.length > 0 && Number.isFinite(value) && value > 0 && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Price preview</p>
            <ul className="grid gap-1 text-sm">
              {previewProcedures.map((procedure) => (
                <li key={procedure.id} className="flex justify-between gap-3 tabular-nums">
                  <span className="truncate">{procedure.name}</span>
                  <span>
                    <s className="text-muted-foreground">{formatPeso(procedure.priceCentavos)}</s>
                    {" → "}
                    <span className="font-semibold text-emerald-700">
                      {formatPeso(
                        discountedPriceCentavos(
                          procedure.priceCentavos,
                          values.discountType,
                          value,
                        ),
                      )}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </ContentCard>

      <ContentCard title="Applies to">
        <div className="grid gap-4">
          <RadioGroupField
            label="Which procedures"
            inline
            options={scopeOptions}
            value={values.appliesTo}
            onValueChange={(appliesTo) => setValues({ appliesTo: appliesTo as PromotionScope })}
          />
          {values.appliesTo === "selected" && (
            <ProcedurePicker
              procedures={procedures}
              selectedIds={values.procedureIds}
              onChange={(procedureIds) => setValues({ procedureIds })}
              error={errors.procedureIds}
            />
          )}
        </div>
      </ContentCard>

      <div className="flex justify-end gap-3">
        <Button asChild variant="outline">
          <Link to="/app/catalog/promotions">Cancel</Link>
        </Button>
        <Button type="submit" loading={submitting}>
          {id ? "Save changes" : "Create promotion"}
        </Button>
      </div>
    </form>
  );
}
