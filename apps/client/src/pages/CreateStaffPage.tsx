import { type CustomRole, createStaffRequestSchema, type StaffRole } from "@homelabconnect/shared";
import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { DatePickerField } from "@/components/form/DatePicker";
import { SelectInputField } from "@/components/form/SelectInputField";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { fetchRoles } from "../api/roles";
import { createStaff } from "../api/users";
import { useAuth } from "../auth/authContext";
import { roleLabels } from "../auth/roleLabels";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { temporaryPasswordMessage } from "../feedback/temporaryPasswordMessage";
import { toFieldErrors } from "../forms/fieldErrors";
import { handleSubmitError } from "../forms/submitErrors";

interface FormValues {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: StaffRole | "";
  hiredOn: string;
  /** NONE, or a custom role id. */
  customRoleId: string;
}

/** Radix Select can't use "" as a value, so this stands for "no custom role". */
const NONE = "none";

const emptyForm: FormValues = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  role: "",
  hiredOn: "",
  customRoleId: NONE,
};

const staffRoles: StaffRole[] = ["med_team", "doctor", "support", "admin"];
const roleOptions = staffRoles.map((role) => ({ value: role, label: roleLabels[role] }));

/** API error codes that belong to a single field. */
const fieldByCode: Record<string, keyof FormValues> = {
  email_taken: "email",
  invalid_email: "email",
  not_a_staff_role: "role",
  role_mismatch: "customRoleId",
  role_not_found: "customRoleId",
};

export function CreateStaffPage() {
  const { token } = useAuth();
  const feedback = useFeedback();
  const can = useCan();
  // Picking a custom role is role assignment: it needs roles.assign, and roles.view to list them.
  const canPickRole = can("roles.assign") && can("roles.view");
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
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

  useEffect(() => {
    if (!token || !canPickRole) return;
    const controller = new AbortController();
    async function load(authToken: string) {
      try {
        setCustomRoles((await fetchRoles(authToken, controller.signal)).customRoles);
      } catch {
        // Without the list the form still works; the account just gets its base role.
      }
    }
    void load(token);
    return () => controller.abort();
  }, [token, canPickRole]);

  const customRoleOptions = [
    { value: NONE, label: values.role ? `None: ${roleLabels[values.role]} only` : "None" },
    ...customRoles
      .filter((role) => role.baseRole === values.role)
      .map((role) => ({ value: role.id, label: role.name })),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createStaffRequestSchema.safeParse({
      email: values.email.trim(),
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone.trim() || null,
      role: values.role || undefined,
      hiredOn: values.hiredOn || null,
      customRoleId: values.customRoleId === NONE ? null : values.customRoleId,
    });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});
    if (!token) return;

    setSubmitting(true);
    try {
      const result = await createStaff(token, parsed.data);
      setValues(emptyForm);
      feedback.success(temporaryPasswordMessage(result, "Staff account created"));
    } catch (error) {
      handleSubmitError(error, {
        title: "Couldn't create the account",
        feedback,
        setFieldErrors,
        fieldByCode,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Create Staff" />
      <ContentCard
        title="New staff account"
        className="max-w-3xl"
        action={
          <Button asChild variant="link" size="sm">
            <Link to="/app/users/all">View all users</Link>
          </Button>
        }
      >
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
          <TextInputField
            label="Email"
            type="email"
            autoComplete="off"
            hint="The temporary password is sent here. It works for 7 days."
            className="sm:col-span-2"
            {...field("email")}
          />
          <TextInputField label="First name" autoComplete="off" {...field("firstName")} />
          <TextInputField label="Last name" autoComplete="off" {...field("lastName")} />
          <SelectInputField
            label="Role"
            name="role"
            placeholder="Choose a role"
            options={roleOptions}
            value={values.role}
            onValueChange={(role) =>
              // A custom role only fits its own base role, so start over when that changes.
              setValues((current) => ({ ...current, role: role as StaffRole, customRoleId: NONE }))
            }
            error={fieldErrors.role}
          />
          <TextInputField label="Mobile number" type="tel" required={false} {...field("phone")} />
          <DatePickerField
            label="Hired on"
            required={false}
            value={values.hiredOn}
            onChange={set("hiredOn")}
            error={fieldErrors.hiredOn}
          />
          {canPickRole && (
            <SelectInputField
              label="Custom role"
              name="customRoleId"
              required={false}
              options={customRoleOptions}
              value={values.customRoleId}
              onValueChange={set("customRoleId")}
              disabled={!values.role}
              hint={values.role ? undefined : "Choose the role first."}
              error={fieldErrors.customRoleId}
            />
          )}
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting} className="mt-2">
              Create account
            </Button>
          </div>
        </form>
      </ContentCard>
    </>
  );
}
