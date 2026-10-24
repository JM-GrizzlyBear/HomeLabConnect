import { type AppointmentStatus, formatPeso } from "@homelabconnect/shared";
import { CircleAlertIcon, SearchIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { Link } from "react-router";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";
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
import { fetchAppointments } from "../api/appointments";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import {
  appointmentStatusLabels,
  appointmentStatusVariants,
  formatVisit,
} from "../format/appointments";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

const ALL = "all";
const PAGE_SIZE = 20;

const statusOptions = [
  { value: ALL, label: "Every status" },
  ...(Object.keys(appointmentStatusLabels) as AppointmentStatus[]).map((status) => ({
    value: status,
    label: appointmentStatusLabels[status],
  })),
];

interface Filters {
  status: AppointmentStatus | typeof ALL;
  q: string;
  page: number;
}

/** Staff: every booking, pending ones first, with accept / reject / new time / cancel. */
export function AllAppointmentsPage() {
  const [filters, setFilters] = useState<Filters>({ status: "pending", q: "", page: 1 });
  const [search, setSearch] = useState("");
  const {
    data: list,
    error,
    reload,
  } = useApiQuery(
    queryKeys.allAppointments(filters),
    async (signal) =>
      await fetchAppointments(
        {
          status: filters.status === ALL ? undefined : filters.status,
          q: filters.q || undefined,
          page: filters.page,
          pageSize: PAGE_SIZE,
        },
        signal,
      ),
    { errorMessage: "Could not load appointments. Try again." },
  );

  function applySearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim(), page: 1 }));
  }

  return (
    <>
      <PageHeader title="All Appointments" />
      <ContentCard title="Bookings">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_14rem]">
          <form onSubmit={applySearch} role="search" className="flex items-end gap-2">
            <TextInputField
              label="Search appointments"
              hideLabel
              type="search"
              icon={<SearchIcon />}
              placeholder="Search code or patient name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
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

        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !list ? (
          <Skeleton className="h-40" aria-label="Loading appointments" />
        ) : list.items.length === 0 ? (
          <EmptyState title="No appointments match." description="Try another status or search." />
        ) : (
          <div className="grid gap-5">
            <Table className="min-w-200">
              <TableHeader>
                <TableRow>
                  <TableHead>Visit</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        to={`/app/appointments/${row.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {row.code}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatVisit(row.date, row.slot)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {row.patient.name}
                      <p className="text-xs text-muted-foreground">
                        {row.patient.phone ?? row.patient.email}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-56 truncate">
                      {row.lines.map((line) => line.code).join(", ")}
                    </TableCell>
                    <TableCell>{formatPeso(row.totalCentavos)}</TableCell>
                    <TableCell>
                      <Badge variant={appointmentStatusVariants[row.status]}>
                        {appointmentStatusLabels[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <AppointmentActions appointment={row} onChanged={reload} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={list.page}
              pageSize={list.pageSize}
              total={list.total}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </div>
        )}
      </ContentCard>
    </>
  );
}
