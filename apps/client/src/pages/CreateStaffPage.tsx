import { createStaffRequestSchema, type StaffRole } from "@homelabconnect/shared";
import type { SubmitEvent } from "react";
import { Link } from "react-router";
import { DatePickerField } from "@/components/form/DatePicker";
import { SelectInputField } from "@/components/form/SelectInputField";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import { fetchRoles } from "../api/roles";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";
import { createStaff } from "../api/users";
import { roleLabels } from "../auth/roleLabels";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { temporaryPasswordMessage } from "../feedback/temporaryPasswordMessage";
import { useFormState } from "../forms/useFormState";

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
  const feedback = useFeedback();
  const can = useCan();
  // Picking a custom role is role assignment: it needs roles.assign, and roles.view to list them.
  const canPickRole = can("roles.assign") && can("roles.view");
  // Without the list the form still works; the account just gets its base role.
  const { data: roleList } = useApiQuery(queryKeys.roles, fetchRoles, { enabled: canPickRole });
  const { values, errors, submitting, set, setValues, field, submit } = useFormState(emptyForm);

  const customRoleOptions = [
    { value: NONE, label: values.role ? `None: ${roleLabels[values.role]} only` : "None" },
    ...(roleList?.customRoles ?? [])
      .filter((role) => role.baseRole === values.role)
      .map((role) => ({ value: role.id, label: role.name })),
  ];

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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
    await submit(
      parsed,
      async (request) => {
        const result = await createStaff(request);
        setValues(emptyForm);
        feedback.success(temporaryPasswordMessage(result, "Staff account created"));
      },
      { title: "Couldn't create the account", fieldByCode },
    );
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
              setValues({ role: role as StaffRole, customRoleId: NONE })
            }
            error={errors.role}
          />
          <TextInputField label="Mobile number" type="tel" required={false} {...field("phone")} />
          <DatePickerField
            label="Hired on"
            required={false}
            value={values.hiredOn}
            onChange={set("hiredOn")}
            error={errors.hiredOn}
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
              error={errors.customRoleId}
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
