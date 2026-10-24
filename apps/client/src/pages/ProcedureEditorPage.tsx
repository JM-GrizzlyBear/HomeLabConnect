import {
  labProcedureRequestSchema,
  type ProcedureCategory,
  type Specimen,
} from "@homelabconnect/shared";
import { CircleAlertIcon } from "lucide-react";
import type { SubmitEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { FormField } from "@/components/form/FormField";
import { SelectInputField } from "@/components/form/SelectInputField";
import { TextInputField } from "@/components/form/TextInputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { createProcedure, fetchCategories, fetchProcedure, updateProcedure } from "../api/catalog";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { centavosToPesos, pesosToCentavos, specimenLabels } from "../format/catalog";
import { useFormState } from "../forms/useFormState";

/** Every field as typed; numbers are converted on submit. Keys match the request schema. */
interface FormValues {
  code: string;
  name: string;
  categoryId: string;
  priceCentavos: string;
  specimen: Specimen | "";
  turnaroundHours: string;
  fastingHours: string;
  preparation: string;
  description: string;
}

const emptyForm: FormValues = {
  code: "",
  name: "",
  categoryId: "",
  priceCentavos: "",
  specimen: "",
  turnaroundHours: "24",
  fastingHours: "0",
  preparation: "",
  description: "",
};

const specimenOptions = (Object.keys(specimenLabels) as Specimen[]).map((specimen) => ({
  value: specimen,
  label: specimenLabels[specimen],
}));

/** API error codes that belong to a single field. */
const fieldByCode: Record<string, keyof FormValues> = {
  procedure_code_taken: "code",
  procedure_name_taken: "name",
  category_not_found: "categoryId",
};

/** "" → NaN, so the schema reports the field as missing rather than 0. */
const toNumber = (text: string) => (text.trim() === "" ? Number.NaN : Number(text));

/** /app/catalog/procedures/new adds a procedure; /app/catalog/procedures/:id edits one. */
export function ProcedureEditorPage() {
  const { id } = useParams();
  const title = id ? "Edit Procedure" : "New Procedure";
  const { data, error: loadError } = useApiQuery(
    queryKeys.procedure(id),
    async (signal) => {
      const [categories, procedure] = await Promise.all([
        fetchCategories(signal),
        id ? fetchProcedure(id, signal) : null,
      ]);
      const initialValues: FormValues = procedure
        ? {
            code: procedure.code,
            name: procedure.name,
            categoryId: procedure.category.id,
            priceCentavos: centavosToPesos(procedure.priceCentavos),
            specimen: procedure.specimen,
            turnaroundHours: String(procedure.turnaroundHours),
            fastingHours: String(procedure.fastingHours),
            preparation: procedure.preparation ?? "",
            description: procedure.description ?? "",
          }
        : emptyForm;
      return { id, categories, initialValues };
    },
    { errorMessage: "Could not load the procedure. Try again." },
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
  // `data` still holds the previous procedure for a moment after moving to another one.
  if (!data || data.id !== id) {
    return (
      <>
        <PageHeader title={title} />
        <Skeleton className="h-120 max-w-3xl" aria-label="Loading the procedure" />
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} />
      <ProcedureForm
        key={id}
        id={id}
        categories={data.categories}
        initialValues={data.initialValues}
      />
    </>
  );
}

interface ProcedureFormProps {
  /** The procedure being edited; undefined when adding one. */
  id: string | undefined;
  categories: ProcedureCategory[];
  initialValues: FormValues;
}

function ProcedureForm({ id, categories, initialValues }: ProcedureFormProps) {
  const isNew = id === undefined;
  const feedback = useFeedback();
  const navigate = useNavigate();
  const {
    values,
    errors: fieldErrors,
    submitting,
    set,
    field,
    submit,
  } = useFormState(initialValues);
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = labProcedureRequestSchema.safeParse({
      code: values.code,
      name: values.name,
      categoryId: values.categoryId || undefined,
      priceCentavos: pesosToCentavos(values.priceCentavos) ?? Number.NaN,
      specimen: values.specimen || undefined,
      turnaroundHours: toNumber(values.turnaroundHours),
      fastingHours: toNumber(values.fastingHours),
      preparation: values.preparation.trim() || null,
      description: values.description.trim() || null,
    });
    await submit(
      parsed,
      async (request) => {
        const saved = id ? await updateProcedure(id, request) : await createProcedure(request);
        feedback.success({
          title: id ? "Procedure saved" : "Procedure added",
          description: `${saved.name} (${saved.code}) is in the catalogue.`,
        });
        navigate("/app/catalog/procedures");
      },
      { title: "Couldn't save the procedure", fieldByCode },
    );
  }

  return (
    <>
      <ContentCard title="Procedure details" className="max-w-3xl">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
          <TextInputField
            label="Code"
            placeholder="e.g. CBC"
            autoComplete="off"
            hint="Short and unique. Letters, digits and dashes."
            {...field("code")}
          />
          <TextInputField
            label="Name"
            placeholder="e.g. Complete Blood Count"
            autoComplete="off"
            {...field("name")}
          />
          <SelectInputField
            label="Category"
            name="categoryId"
            placeholder={categories.length ? "Choose a category" : "Add a category first"}
            options={categoryOptions}
            value={values.categoryId}
            onValueChange={set("categoryId")}
            disabled={categories.length === 0}
            error={fieldErrors.categoryId}
          />
          <TextInputField
            label="Price"
            inputMode="decimal"
            placeholder="0.00"
            icon={<span className="text-sm font-medium">₱</span>}
            {...field("priceCentavos")}
          />
          <SelectInputField
            label="Specimen"
            name="specimen"
            placeholder="Choose a specimen"
            options={specimenOptions}
            value={values.specimen}
            onValueChange={set("specimen")}
            error={fieldErrors.specimen}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInputField
              label="Results in (hours)"
              type="number"
              min={1}
              max={720}
              {...field("turnaroundHours")}
            />
            <TextInputField
              label="Fasting (hours)"
              type="number"
              min={0}
              max={24}
              hint="0 for none."
              {...field("fastingHours")}
            />
          </div>
          <FormField
            label="How to prepare"
            optional
            error={fieldErrors.preparation}
            className="sm:col-span-2"
          >
            {(control) => (
              <Textarea
                {...control}
                name="preparation"
                placeholder="e.g. Fast for 8 hours before collection. Water is allowed."
                value={values.preparation}
                onChange={(e) => set("preparation")(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label="Description"
            optional
            error={fieldErrors.description}
            className="sm:col-span-2"
          >
            {(control) => (
              <Textarea
                {...control}
                name="description"
                placeholder="What this test checks, in plain words."
                value={values.description}
                onChange={(e) => set("description")(e.target.value)}
              />
            )}
          </FormField>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button asChild variant="outline">
              <Link to="/app/catalog/procedures">Cancel</Link>
            </Button>
            <Button type="submit" loading={submitting}>
              {isNew ? "Add procedure" : "Save changes"}
            </Button>
          </div>
        </form>
      </ContentCard>
    </>
  );
}
