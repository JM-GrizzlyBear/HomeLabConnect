import {
  type BaseRole,
  createCustomRoleRequestSchema,
  type PermissionEntry,
  type RoleList,
} from "@homelabconnect/shared";
import { CircleAlertIcon } from "lucide-react";
import type { SubmitEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { PermissionMatrix } from "@/components/access/PermissionMatrix";
import { FormField } from "@/components/form/FormField";
import { SelectInputField } from "@/components/form/SelectInputField";
import { TextInputField } from "@/components/form/TextInputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { entrySummary } from "../access/rolePermissions";
import { createRole, fetchRole, fetchRoles, updateRole } from "../api/roles";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";
import { roleLabels } from "../auth/roleLabels";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { useFormState } from "../forms/useFormState";

interface FormValues {
  name: string;
  baseRole: BaseRole | "";
  description: string;
  entries: PermissionEntry[];
}

const emptyForm: FormValues = { name: "", baseRole: "", description: "", entries: [] };

const baseRoleOptions = (Object.keys(roleLabels) as BaseRole[]).map((role) => ({
  value: role,
  label: roleLabels[role],
}));

/** /app/users/roles/new creates a custom role; /app/users/roles/:id edits one. */
export function RoleEditorPage() {
  const { id } = useParams();
  const title = id ? "Edit Role" : "New Role";
  const { data, error: loadError } = useApiQuery(
    queryKeys.role(id),
    async (signal) => {
      const [roles, role] = await Promise.all([
        fetchRoles(signal),
        id ? fetchRole(id, signal) : null,
      ]);
      const initialValues: FormValues = role
        ? {
            name: role.name,
            baseRole: role.baseRole,
            description: role.description ?? "",
            entries: role.entries,
          }
        : emptyForm;
      return { id, roles, initialValues };
    },
    { errorMessage: "Could not load the role. Try again." },
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
  // `data` still holds the previous role for a moment after moving to another one.
  if (!data || data.id !== id) {
    return (
      <>
        <PageHeader title={title} />
        <div className="grid gap-4" aria-label="Loading the role">
          <Skeleton className="h-40" />
          <Skeleton className="h-96" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} />
      <RoleForm key={id} id={id} roles={data.roles} initialValues={data.initialValues} />
    </>
  );
}

interface RoleFormProps {
  /** The role being edited; undefined when creating one. */
  id: string | undefined;
  roles: RoleList;
  initialValues: FormValues;
}

function RoleForm({ id, roles, initialValues }: RoleFormProps) {
  const isNew = id === undefined;
  const feedback = useFeedback();
  const navigate = useNavigate();
  const {
    values,
    errors: fieldErrors,
    submitting,
    setValues: set,
    submit,
  } = useFormState(initialValues);

  const baseGrants = values.baseRole
    ? (roles.baseRoles.find((role) => role.id === values.baseRole)?.grants ?? [])
    : [];
  const { granted, denied } = entrySummary(values.entries);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createCustomRoleRequestSchema.safeParse({
      name: values.name,
      baseRole: values.baseRole || undefined,
      description: values.description.trim() || null,
      entries: values.entries,
    });
    await submit(
      parsed,
      async (request) => {
        const { name, description, entries } = request;
        const saved = id
          ? await updateRole(id, { name, description, entries })
          : await createRole(request);
        feedback.success({
          title: id ? "Role saved" : "Role created",
          description: `${saved.name} is ready. People holding it get the changes on their next click.`,
        });
        navigate("/app/users/roles");
      },
      { title: "Couldn't save the role", fieldByCode: { role_name_taken: "name" } },
    );
  }

  return (
    <>
      <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
        <ContentCard title="Role details" className="max-w-3xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInputField
              label="Name"
              name="name"
              placeholder="e.g. Senior Med Tech"
              value={values.name}
              onChange={(e) => set({ name: e.target.value })}
              error={fieldErrors.name}
            />
            <SelectInputField
              label="Built on"
              name="baseRole"
              placeholder="Choose a base role"
              options={baseRoleOptions}
              value={values.baseRole}
              onValueChange={(baseRole) => set({ baseRole: baseRole as BaseRole, entries: [] })}
              disabled={!isNew}
              hint={isNew ? "Holders start with this role's permissions." : "Fixed once created."}
              error={fieldErrors.baseRole}
            />
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
                  placeholder="What is this role for?"
                  value={values.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              )}
            </FormField>
          </div>
        </ContentCard>

        <ContentCard
          title="Permissions"
          action={
            <span className="text-xs text-muted-foreground">
              {granted} allowed · {denied} denied
            </span>
          }
        >
          {values.baseRole ? (
            <PermissionMatrix
              baseGrants={baseGrants}
              entries={values.entries}
              onChange={(entries) => set({ entries })}
            />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Choose the base role first; you then allow or deny single permissions on top of it.
            </p>
          )}
          {fieldErrors.entries && (
            <p className="mt-3 text-sm text-destructive">{fieldErrors.entries}</p>
          )}
        </ContentCard>

        <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
          <Button asChild variant="outline">
            <Link to="/app/users/roles">Cancel</Link>
          </Button>
          <Button type="submit" loading={submitting}>
            {isNew ? "Create role" : "Save changes"}
          </Button>
        </div>
      </form>
    </>
  );
}
