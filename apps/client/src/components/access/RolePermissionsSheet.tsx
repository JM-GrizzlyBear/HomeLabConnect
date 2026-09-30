import type { PermissionEntry } from "@homelabconnect/shared";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PermissionMatrix } from "./PermissionMatrix";

interface RolePermissionsSheetProps {
  /** The role to show, or null when closed. */
  role: {
    name: string;
    description?: string | null;
    baseGrants: readonly string[];
    entries: readonly PermissionEntry[];
  } | null;
  onClose(): void;
}

/** A read-only side panel listing what a role can do. */
export function RolePermissionsSheet({ role, onClose }: RolePermissionsSheetProps) {
  return (
    <Sheet open={role !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {role && (
          <>
            <SheetHeader>
              <SheetTitle>{role.name}</SheetTitle>
              <SheetDescription>{role.description ?? "What this role can do."}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">
              <PermissionMatrix baseGrants={role.baseGrants} entries={role.entries} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
