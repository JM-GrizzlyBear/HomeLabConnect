import type { BaseRole, CustomRole } from "@homelabconnect/shared";
import { CircleAlertIcon, EyeIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ActionsMenu } from "@/components/ActionsMenu";
import { RolePermissionsSheet } from "@/components/access/RolePermissionsSheet";
import { EmptyState } from "@/components/data/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { entrySummary } from "../access/rolePermissions";
import { ApiError } from "../api/apiClient";
import { deleteRole, fetchRoles } from "../api/roles";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";
import { roleLabels } from "../auth/roleLabels";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";

type Viewing = Parameters<typeof RolePermissionsSheet>[0]["role"];

export function RolesPage() {
  const can = useCan();
  const feedback = useFeedback();
  const navigate = useNavigate();
  const {
    data: roles,
    error: loadError,
    reload,
  } = useApiQuery(queryKeys.roles, fetchRoles, {
    errorMessage: "Could not load roles. Try again.",
  });
  const [viewing, setViewing] = useState<Viewing>(null);

  const grantsOf = (baseRole: BaseRole) =>
    roles?.baseRoles.find((role) => role.id === baseRole)?.grants ?? [];

  async function remove(role: CustomRole) {
    const confirmed = await feedback.confirm({
      title: `Delete ${role.name}?`,
      description: "This can't be undone. Roles that someone holds can't be deleted.",
      confirmLabel: "Delete role",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deleteRole(role.id);
      feedback.success({ title: "Role deleted", description: `${role.name} has been deleted.` });
      reload();
    } catch (error) {
      feedback.error({
        title: "Couldn't delete the role",
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        action={
          can("roles.manage") && (
            <Button asChild>
              <Link to="/app/users/roles/new">
                <PlusIcon />
                New role
              </Link>
            </Button>
          )
        }
      />

      {loadError ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6">
          <ContentCard title="Custom roles">
            {roles && roles.customRoles.length === 0 ? (
              <EmptyState
                title="No custom roles yet."
                description="Build one on top of a base role to grant or deny single permissions."
              />
            ) : (
              <Table className="min-w-160">
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Built on</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles
                    ? roles.customRoles.map((role) => {
                        const { granted, denied } = entrySummary(role.entries);
                        return (
                          <TableRow key={role.id}>
                            <TableCell className="max-w-80 whitespace-normal">
                              <p className="font-medium text-slate-800">{role.name}</p>
                              {role.description && (
                                <p className="text-muted-foreground">{role.description}</p>
                              )}
                            </TableCell>
                            <TableCell>{roleLabels[role.baseRole]}</TableCell>
                            <TableCell className="space-x-1">
                              {granted > 0 && <Badge variant="success">+{granted} allowed</Badge>}
                              {denied > 0 && <Badge variant="destructive">−{denied} denied</Badge>}
                              {granted + denied === 0 && (
                                <span className="text-muted-foreground">Same as base</span>
                              )}
                            </TableCell>
                            <TableCell>{role.userCount}</TableCell>
                            <TableCell className="text-right">
                              <ActionsMenu
                                label={`Actions for ${role.name}`}
                                items={[
                                  {
                                    label: "View permissions",
                                    icon: <EyeIcon />,
                                    onSelect: () =>
                                      setViewing({
                                        name: role.name,
                                        description: role.description,
                                        baseGrants: grantsOf(role.baseRole),
                                        entries: role.entries,
                                      }),
                                  },
                                  {
                                    label: "Edit",
                                    icon: <PencilIcon />,
                                    hidden: !can("roles.manage"),
                                    onSelect: () => navigate(`/app/users/roles/${role.id}`),
                                  },
                                  {
                                    label: "Delete",
                                    icon: <Trash2Icon />,
                                    destructive: true,
                                    hidden: !can("roles.manage"),
                                    onSelect: () => void remove(role),
                                  },
                                ]}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    : Array.from({ length: 2 }, (_, i) => (
                        <TableRow key={i} aria-hidden>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-9" />
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            )}
          </ContentCard>

          <ContentCard title="Base roles">
            <p className="mb-4 text-sm text-muted-foreground">
              Every account has one base role. Their permissions are fixed; build a custom role to
              change them. Admins always have every permission.
            </p>
            <Table className="min-w-120">
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">View</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.baseRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium text-slate-800">
                      {roleLabels[role.id]}
                    </TableCell>
                    <TableCell>{role.id === "admin" ? "All" : role.grants.length}</TableCell>
                    <TableCell>{role.userCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`View ${roleLabels[role.id]} permissions`}
                        onClick={() =>
                          setViewing({
                            name: roleLabels[role.id],
                            description:
                              role.id === "admin"
                                ? "Admins always have every permission."
                                : "What every account with this base role can do.",
                            baseGrants: role.grants,
                            entries: [],
                          })
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ContentCard>
        </div>
      )}

      <RolePermissionsSheet role={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
