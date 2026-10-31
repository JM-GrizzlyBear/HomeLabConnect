import type { PermissionEntry, UserPermissions, UserSummary } from "@homelabconnect/shared";
import { useState } from "react";
import { DatePicker } from "@/components/form/DatePicker";
import { FormField } from "@/components/form/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../../api/apiClient";
import { fetchUserPermissions, setUserOverrides } from "../../api/users";
import { useCan } from "../../auth/useCan";
import { roleLabels } from "../../auth/roleLabels";
import { useFeedback } from "../../feedback/feedbackContext";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { PermissionMatrix } from "./PermissionMatrix";

interface UserPermissionsSheetProps {
  /** The user to show, or null when closed. */
  user: UserSummary | null;
  onClose(): void;
}

/**
 * What one person may do. With permissions.override, an admin allows or denies them single
 * permissions on top of their role, for good or until a date.
 */
export function UserPermissionsSheet({ user, onClose }: UserPermissionsSheetProps) {
  return (
    <Sheet open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {user && (
          <>
            <SheetHeader>
              <SheetTitle>
                Permissions for {user.firstName} {user.lastName}
              </SheetTitle>
              <SheetDescription>
                {roleLabels[user.role]}
                {user.customRole && ` · ${user.customRole.name}`}. "Allow" or "Deny" here applies to
                this person only, on their next click.
              </SheetDescription>
            </SheetHeader>
            <SheetBody key={user.id} user={user} onClose={onClose} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({ user, onClose }: { user: UserSummary; onClose(): void }) {
  const { data, error } = useApiQuery(
    queryKeys.userPermissions(user.id),
    async (signal) => await fetchUserPermissions(user.id, signal),
    { errorMessage: "Could not load their permissions." },
  );
  if (error) {
    return (
      <Alert variant="destructive" className="mx-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!data) return <Skeleton className="mx-4 h-64" aria-label="Loading permissions" />;
  return <OverridesForm permissions={data} onClose={onClose} />;
}

function OverridesForm({
  permissions,
  onClose,
}: {
  permissions: UserPermissions;
  onClose(): void;
}) {
  const can = useCan();
  const feedback = useFeedback();
  const editable = can("permissions.override") && permissions.role !== "admin";
  const [entries, setEntries] = useState<PermissionEntry[]>(() =>
    permissions.overrides.map(({ key, effect }) => ({ key, effect }) as PermissionEntry),
  );
  // One end date for this person's overrides; empty means "until removed"
  const [until, setUntil] = useState(
    () =>
      permissions.overrides
        .map((override) => override.until)
        .filter(Boolean)
        .sort()[0] ?? "",
  );
  const [saving, setSaving] = useState(false);
  const inherited = permissions.permissions
    .filter((permission) => permission.inherited)
    .map((permission) => permission.key);

  async function save() {
    setSaving(true);
    try {
      await setUserOverrides(
        permissions.userId,
        entries.map((entry) => ({ ...entry, until: until || null })),
      );
      feedback.success({ title: "Permissions saved" });
      onClose();
    } catch (failure) {
      setSaving(false);
      feedback.error({
        title: "Couldn't save the permissions",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <>
      <div className="grid gap-5 px-4 pb-4">
        {permissions.role === "admin" && (
          <Alert>
            <AlertDescription>Admins always have every permission.</AlertDescription>
          </Alert>
        )}
        {editable && (
          <FormField
            label="Until"
            optional
            hint="The changes below stop at the end of this day. Leave empty to keep them."
          >
            {(control) => <DatePicker {...control} value={until} onChange={setUntil} />}
          </FormField>
        )}
        <PermissionMatrix
          baseGrants={inherited}
          entries={entries}
          onChange={editable ? setEntries : undefined}
        />
      </div>
      {editable && (
        <SheetFooter className="border-t">
          <Button onClick={() => void save()} loading={saving}>
            Save permissions
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
