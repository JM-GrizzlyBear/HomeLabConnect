import { CircleAlertIcon, LockIcon } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/data/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyResults } from "../api/results";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { formatVisit } from "../format/appointments";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

/** A patient's released results, newest visit first: ready to open, or locked until paid. */
export function MyResultsPage() {
  const { data, error } = useApiQuery(queryKeys.myResults, fetchMyResults, {
    errorMessage: "Could not load your results. Try again.",
  });

  return (
    <>
      <PageHeader title="My Results" />
      <ContentCard title="Results">
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !data ? (
          <Skeleton className="h-32" aria-label="Loading your results" />
        ) : data.length === 0 ? (
          <EmptyState
            title="No results yet."
            description="We email you as soon as a doctor releases your results."
          />
        ) : (
          <ul className="divide-y" aria-label="Results">
            {data.map((item) => (
              <li
                key={item.appointmentId}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium">{item.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatVisit(item.date, item.slot)} · {item.testsCollected}{" "}
                    {item.testsCollected === 1 ? "test" : "tests"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {item.state === "ready" ? (
                    <Badge variant="success">Ready</Badge>
                  ) : (
                    <Badge variant="outline">
                      <LockIcon />
                      Pay to view
                    </Badge>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/app/appointments/${item.appointmentId}`}>
                      {item.state === "ready" ? "View results" : "Open"}
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ContentCard>
    </>
  );
}
