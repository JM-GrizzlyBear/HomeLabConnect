import type {
  CatalogStatus,
  LabProcedure,
  LabProcedureList,
  ProcedureCategory,
} from "@homelabconnect/shared";
import {
  CircleAlertIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
  SearchIcon,
  TagsIcon,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ActionsMenu } from "@/components/ActionsMenu";
import { ManageCategoriesDialog } from "@/components/catalog/ManageCategoriesDialog";
import { ProcedureDetailsSheet } from "@/components/catalog/ProcedureDetailsSheet";
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
import { fetchCategories, fetchProcedures, setProcedureStatus } from "../api/catalog";
import { useAuth } from "../auth/authContext";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { formatPeso, formatTurnaround, specimenLabels } from "../format/catalog";

const PAGE_SIZE = 20;
/** Radix Select can't use "" as a value, so "all" stands for "no filter". */
const ALL = "all";

interface Filters {
  q: string;
  categoryId: string;
  status: CatalogStatus | typeof ALL;
  page: number;
}

const statusOptions = [
  { value: ALL, label: "Any status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/** The lab procedure catalogue: read-only for most people, editable with procedures.manage. */
export function ProceduresPage() {
  const { token } = useAuth();
  const feedback = useFeedback();
  const can = useCan();
  const navigate = useNavigate();
  const canManage = can("procedures.manage");
  const [filters, setFilters] = useState<Filters>({ q: "", categoryId: ALL, status: ALL, page: 1 });
  const [search, setSearch] = useState("");
  const [list, setList] = useState<LabProcedureList | null>(null);
  const [categories, setCategories] = useState<ProcedureCategory[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [viewing, setViewing] = useState<LabProcedure | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    async function load(authToken: string) {
      try {
        const result = await fetchProcedures(
          authToken,
          {
            q: filters.q || undefined,
            categoryId: filters.categoryId === ALL ? undefined : filters.categoryId,
            status: filters.status === ALL ? undefined : filters.status,
            page: filters.page,
            pageSize: PAGE_SIZE,
          },
          controller.signal,
        );
        setList(result);
        setLoadError(null);
      } catch {
        if (!controller.signal.aborted) setLoadError("Could not load procedures. Try again.");
      }
    }
    void load(token);
    return () => controller.abort();
  }, [token, filters, reload]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    async function load(authToken: string) {
      try {
        setCategories(await fetchCategories(authToken, controller.signal));
      } catch {
        // The category filter just stays empty; the list itself still loads.
      }
    }
    void load(token);
    return () => controller.abort();
  }, [token, reload]);

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim(), page: 1 }));
  }

  async function changeStatus(procedure: LabProcedure, isActive: boolean) {
    const confirmed = await feedback.confirm(
      isActive
        ? {
            title: `Reactivate ${procedure.name}?`,
            description: "Patients will be able to see and book it again.",
            confirmLabel: "Reactivate",
          }
        : {
            title: `Deactivate ${procedure.name}?`,
            description:
              "Patients won't see it or be able to book it. Past appointments and payments keep it.",
            confirmLabel: "Deactivate",
            destructive: true,
          },
    );
    if (!confirmed || !token) return;
    try {
      await setProcedureStatus(token, procedure.id, isActive);
      feedback.success({
        title: isActive ? "Procedure reactivated" : "Procedure deactivated",
        description: isActive
          ? `${procedure.name} is back in the catalogue.`
          : `${procedure.name} is hidden from patients.`,
      });
      setReload((n) => n + 1);
    } catch (error) {
      feedback.error({
        title: isActive ? "Couldn't reactivate the procedure" : "Couldn't deactivate the procedure",
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    }
  }

  const categoryOptions = [
    { value: ALL, label: "All categories" },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ];
  const columns = canManage ? 7 : 6;

  return (
    <>
      <PageHeader
        title="Lab Procedures"
        action={
          canManage && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setManagingCategories(true)}>
                <TagsIcon />
                Categories
              </Button>
              <Button asChild>
                <Link to="/app/catalog/procedures/new">
                  <PlusIcon />
                  New procedure
                </Link>
              </Button>
            </div>
          )
        }
      />

      <ContentCard title="Catalogue">
        <div
          className={
            canManage
              ? "mb-5 grid gap-3 md:grid-cols-[1fr_14rem_12rem]"
              : "mb-5 grid gap-3 md:grid-cols-[1fr_14rem]"
          }
        >
          <form onSubmit={applySearch} role="search" className="flex items-end gap-2">
            <TextInputField
              label="Search procedures"
              hideLabel
              type="search"
              icon={<SearchIcon />}
              placeholder="Search code or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          <SelectInputField
            label="Category"
            hideLabel
            options={categoryOptions}
            value={filters.categoryId}
            onValueChange={(categoryId) =>
              setFilters((current) => ({ ...current, categoryId, page: 1 }))
            }
          />
          {canManage && (
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
          )}
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : list && list.items.length === 0 ? (
          <EmptyState
            title="No procedures match these filters."
            description="Try a different search or category."
          />
        ) : (
          <div className="grid gap-5">
            <Table className="min-w-176">
              <TableHeader>
                <TableRow>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Specimen</TableHead>
                  <TableHead>Results in</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  {canManage && <TableHead>Status</TableHead>}
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list
                  ? list.items.map((procedure) => (
                      <TableRow key={procedure.id}>
                        <TableCell>
                          <p className="font-medium text-slate-800">{procedure.name}</p>
                          <p className="text-muted-foreground">{procedure.code}</p>
                        </TableCell>
                        <TableCell>{procedure.category.name}</TableCell>
                        <TableCell>{specimenLabels[procedure.specimen]}</TableCell>
                        <TableCell>{formatTurnaround(procedure.turnaroundHours)}</TableCell>
                        <TableCell className="text-right font-medium text-slate-800 tabular-nums">
                          {formatPeso(procedure.priceCentavos)}
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            {procedure.isActive ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="muted">Inactive</Badge>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <ActionsMenu
                            label={`Actions for ${procedure.name}`}
                            items={[
                              {
                                label: "View details",
                                icon: <EyeIcon />,
                                onSelect: () => setViewing(procedure),
                              },
                              {
                                label: "Edit",
                                icon: <PencilIcon />,
                                hidden: !canManage,
                                onSelect: () => navigate(`/app/catalog/procedures/${procedure.id}`),
                              },
                              {
                                label: "Reactivate",
                                icon: <PowerIcon />,
                                hidden: !canManage || procedure.isActive,
                                onSelect: () => void changeStatus(procedure, true),
                              },
                              {
                                label: "Deactivate",
                                icon: <PowerOffIcon />,
                                destructive: true,
                                hidden: !canManage || !procedure.isActive,
                                onSelect: () => void changeStatus(procedure, false),
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  : Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i} aria-hidden>
                        <TableCell colSpan={columns}>
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

      <ProcedureDetailsSheet procedure={viewing} onClose={() => setViewing(null)} />
      {canManage && (
        <ManageCategoriesDialog
          open={managingCategories}
          categories={categories}
          onClose={() => setManagingCategories(false)}
          onChanged={() => setReload((n) => n + 1)}
        />
      )}
    </>
  );
}
