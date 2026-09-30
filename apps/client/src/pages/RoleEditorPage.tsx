import {
  type BaseRole,
  createCustomRoleRequestSchema,
  type PermissionEntry,
  type RoleList,
} from "@homelabconnect/shared";
import { CircleAlertIcon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
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
import { useAuth } from "../auth/authContext";
import { roleLabels } from "../auth/roleLabels";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { toFieldErrors } from "../forms/fieldErrors";
import { handleSubmitError } from "../forms/submitErrors";

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
  const isNew = id === undefined;
  const { token } = useAuth();
  const feedback = useFeedback();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleList | null>(null);
  const [values, setValues] = useState<FormValues | null>(isNew ? emptyForm : null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    async function load(authToken: string) {
      try {
        const [list, role] = await Promise.all([
          fetchRoles(authToken, controller.signal),
          id ? fetchRole(authToken, id, controller.signal) : null,
        ]);
        setRoles(list);
        if (role) {
          setValues({
            name: role.name,
            baseRole: role.baseRole,
            description: role.description ?? "",
            entries: role.entries,
          });
        }
      } catch {
        if (!controller.signal.aborted) setLoadError("Could not load the role. Try again.");
      }
    }
    void load(token);
    return () => controller.abort();
  }, [token, id]);

  const title = isNew ? "New Role" : "Edit Role";

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
  if (!values || !roles) {
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

  const set = (changes: Partial<FormValues>) =>
    setValues((current) => (current ? { ...current, ...changes } : current));
  const baseGrants = values.baseRole
    ? (roles.baseRoles.find((role) => role.id === values.baseRole)?.grants ?? [])
    : [];
  const { granted, denied } = entrySummary(values.entries);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values || !token) return;

    const parsed = createCustomRoleRequestSchema.safeParse({
      name: values.name,
      baseRole: values.baseRole || undefined,
      description: values.description.trim() || null,
      entries: values.entries,
    });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const { name, description, entries } = parsed.data;
      const saved = id
        ? await updateRole(token, id, { name, description, entries })
        : await createRole(token, parsed.data);
      feedback.success({
        title: id ? "Role saved" : "Role created",
        description: `${saved.name} is ready. People holding it get the changes on their next click.`,
      });
      navigate("/app/users/roles");
    } catch (error) {
      setSubmitting(false);
      handleSubmitError(error, {
        title: "Couldn't save the role",
        feedback,
        setFieldErrors,
        fieldByCode: { role_name_taken: "name" },
      });
    }
  }

  return (
    <>
      <PageHeader title={title} />
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
