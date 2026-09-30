import type { BaseRole, UserStatus, UserSummary } from "@homelabconnect/shared";
import {
  CircleAlertIcon,
  KeyRoundIcon,
  SearchIcon,
  ShieldIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { Link } from "react-router";
import { ActionsMenu } from "@/components/ActionsMenu";
import { ChangeRoleDialog } from "@/components/access/ChangeRoleDialog";
import { EmptyState } from "@/components/data/EmptyState";
import { TablePagination } from "@/components/data/TablePagination";
import { SelectInputField } from "@/components/form/SelectInputField";
import { TextInputField } from "@/components/form/TextInputField";
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
import { ApiError } from "../api/apiClient";
import { useApiData } from "../api/useApiData";
import { fetchUsers, reissueTemporaryPassword, setUserStatus } from "../api/users";
import { useAuth } from "../auth/authContext";
import { useCan } from "../auth/useCan";
import { roleLabels } from "../auth/roleLabels";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { temporaryPasswordMessage } from "../feedback/temporaryPasswordMessage";
import { formatDate } from "../format/dates";

const PAGE_SIZE = 20;
/** Radix Select can't use "" as a value, so "all" stands for "no filter". */
const ALL = "all";

interface Filters {
  q: string;
  role: BaseRole | typeof ALL;
  status: UserStatus | typeof ALL;
  page: number;
}

const roleOptions = [
  { value: ALL, label: "All roles" },
  ...(Object.keys(roleLabels) as BaseRole[]).map((role) => ({
    value: role,
    label: roleLabels[role],
  })),
];
const statusOptions = [
  { value: ALL, label: "Any status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function UsersPage() {
  const { token, user: me } = useAuth();
  const feedback = useFeedback();
  const can = useCan();
  const [filters, setFilters] = useState<Filters>({ q: "", role: ALL, status: ALL, page: 1 });
  const [search, setSearch] = useState("");
  const {
    data: list,
    error: loadError,
    reload,
  } = useApiData(
    (authToken, signal) =>
      fetchUsers(
        authToken,
        {
          q: filters.q || undefined,
          role: filters.role === ALL ? undefined : filters.role,
          status: filters.status === ALL ? undefined : filters.status,
          page: filters.page,
          pageSize: PAGE_SIZE,
        },
        signal,
      ),
    [filters],
    { errorMessage: "Could not load users. Try again." },
  );
  const [changingRole, setChangingRole] = useState<UserSummary | null>(null);

  function applySearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim(), page: 1 }));
  }

  async function run(action: () => Promise<void>, failureTitle: string) {
    try {
      await action();
      reload();
    } catch (error) {
      feedback.error({
        title: failureTitle,
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    }
  }

  async function changeStatus(target: UserSummary, isActive: boolean) {
    const name = `${target.firstName} ${target.lastName}`;
    const confirmed = await feedback.confirm(
      isActive
        ? {
            title: `Reactivate ${name}?`,
            description: `${target.email} will be able to sign in again.`,
            confirmLabel: "Reactivate",
          }
        : {
            title: `Deactivate ${name}?`,
            description: `${target.email} will be signed out everywhere and won't be able to sign in until reactivated.`,
            confirmLabel: "Deactivate",
            destructive: true,
          },
    );
    if (!confirmed || !token) return;
    await run(
      async () => {
        await setUserStatus(token, target.id, isActive);
        feedback.success({
          title: isActive ? "Account reactivated" : "Account deactivated",
          description: isActive
            ? `${target.email} can sign in again.`
            : `${target.email} has been deactivated and signed out everywhere.`,
        });
      },
      isActive ? "Couldn't reactivate the account" : "Couldn't deactivate the account",
    );
  }

  async function reissue(target: UserSummary) {
    const confirmed = await feedback.confirm({
      title: `Send ${target.firstName} a new temporary password?`,
      description: `Their current password stops working and they're signed out everywhere. The new one is emailed to ${target.email} and works for 7 days.`,
      confirmLabel: "Send new password",
    });
    if (!confirmed || !token) return;
    await run(async () => {
      const result = await reissueTemporaryPassword(token, target.id);
      feedback.success(temporaryPasswordMessage(result, "New temporary password sent"));
    }, "Couldn't issue a new temporary password");
  }

  return (
    <>
      <PageHeader
        title="All Users"
        action={
          can("users.create") && (
            <Button asChild>
              <Link to="/app/users/new">Create staff</Link>
            </Button>
          )
        }
      />

      <ContentCard title="Accounts">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
          <form onSubmit={applySearch} role="search" className="flex items-end gap-2">
            <TextInputField
              label="Search users"
              hideLabel
              type="search"
              icon={<SearchIcon />}
              placeholder="Search name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          <SelectInputField
            label="Role"
            hideLabel
            options={roleOptions}
            value={filters.role}
            onValueChange={(role) =>
              setFilters((current) => ({ ...current, role: role as Filters["role"], page: 1 }))
            }
          />
          <SelectInputField
            label="Status"
            hideLabel
            options={statusOptions}
            value={filters.status}
            onValueChange={(status) =>
              setFilters((current) => ({
                ...current,
                status: status as Filters["status"],
                page: 1,
              }))
            }
          />
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : list && list.items.length === 0 ? (
          <EmptyState
            title="No users match these filters."
            description="Try a different search, role or status."
          />
        ) : (
          <div className="grid gap-5">
            <Table className="min-w-176">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last sign-in</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list
                  ? list.items.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-medium text-slate-800">
                            {row.firstName} {row.lastName}
                          </p>
                          <p className="text-muted-foreground">{row.email}</p>
                        </TableCell>
                        <TableCell>
                          <p>{roleLabels[row.role]}</p>
                          {row.customRole && (
                            <p className="text-xs text-muted-foreground">{row.customRole.name}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge user={row} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.lastLoginAt ? formatDate(row.lastLoginAt) : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.id === me?.id ? (
                            // Your own password and status are managed from Account Profile.
                            <span className="text-xs text-muted-foreground">You</span>
                          ) : (
                            <ActionsMenu
                              label={`Actions for ${row.firstName} ${row.lastName}`}
                              items={[
                                {
                                  label: "Change role",
                                  icon: <ShieldIcon />,
                                  hidden: !can("roles.assign") || !can("roles.view"),
                                  onSelect: () => setChangingRole(row),
                                },
                                {
                                  label: "Send new temporary password",
                                  icon: <KeyRoundIcon />,
                                  hidden: !row.isActive || !can("users.reset_password"),
                                  onSelect: () => void reissue(row),
                                },
                                {
                                  label: "Reactivate",
                                  icon: <UserCheckIcon />,
                                  hidden: row.isActive || !can("users.deactivate"),
                                  onSelect: () => void changeStatus(row, true),
                                },
                                {
                                  label: "Deactivate",
                                  icon: <UserXIcon />,
                                  destructive: true,
                                  hidden: !row.isActive || !can("users.deactivate"),
                                  onSelect: () => void changeStatus(row, false),
                                },
                              ]}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  : Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i} aria-hidden>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-9" />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
            {list && (
              <TablePagination
                page={list.page}
                pageSize={list.pageSize}
                total={list.total}
                onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              />
            )}
          </div>
        )}
      </ContentCard>

      <ChangeRoleDialog
        user={changingRole}
        onClose={() => setChangingRole(null)}
        onChanged={reload}
      />
    </>
  );
}

function StatusBadge({ user }: { user: UserSummary }) {
  if (!user.isActive) return <Badge variant="muted">Inactive</Badge>;
  if (!user.mustChangePassword) return <Badge variant="success">Active</Badge>;
  const expiresAt = user.temporaryPasswordExpiresAt;
  if (expiresAt && new Date(expiresAt) <= new Date()) {
    return <Badge variant="destructive">Temp password expired</Badge>;
  }
  return (
    <Badge variant="warning">
      {expiresAt ? `Temp password · expires ${formatDate(expiresAt)}` : "Temp password"}
    </Badge>
  );
}
