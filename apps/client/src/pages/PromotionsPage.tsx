import type { Promotion, PromotionStatus } from "@homelabconnect/shared";
import { CircleAlertIcon, PencilIcon, PlusIcon, PowerIcon, PowerOffIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ActionsMenu } from "@/components/ActionsMenu";
import { EmptyState } from "@/components/data/EmptyState";
import { SelectInputField } from "@/components/form/SelectInputField";
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
import { fetchPromotions, setPromotionStatus } from "../api/catalog";
import { useApiData } from "../api/useApiData";
import { useAuth } from "../auth/authContext";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { formatDateRange, formatDiscount, promotionStatusLabels } from "../format/catalog";

/** Radix Select can't use "" as a value, so "all" stands for "no filter". */
const ALL = "all";

const statusOptions = [
  { value: ALL, label: "Any status" },
  ...(Object.keys(promotionStatusLabels) as PromotionStatus[]).map((status) => ({
    value: status,
    label: promotionStatusLabels[status],
  })),
];

const statusBadge: Record<PromotionStatus, "success" | "warning" | "muted" | "destructive"> = {
  running: "success",
  scheduled: "warning",
  ended: "muted",
  off: "destructive",
};

/** Sales and discounts: running ones for everyone, all of them for promotions.manage. */
export function PromotionsPage() {
  const { token } = useAuth();
  const feedback = useFeedback();
  const can = useCan();
  const navigate = useNavigate();
  const canManage = can("promotions.manage");
  const [status, setStatus] = useState<PromotionStatus | typeof ALL>(ALL);
  const {
    data: promotions,
    error: loadError,
    reload,
  } = useApiData(
    (authToken, signal) =>
      fetchPromotions(authToken, { status: status === ALL ? undefined : status }, signal),
    [status],
    { errorMessage: "Could not load promotions. Try again." },
  );

  async function switchPromotion(promotion: Promotion, isActive: boolean) {
    if (!isActive) {
      const confirmed = await feedback.confirm({
        title: `Turn off ${promotion.name}?`,
        description: "Prices go back to normal right away. You can turn it back on later.",
        confirmLabel: "Turn off",
        destructive: true,
      });
      if (!confirmed) return;
    }
    if (!token) return;
    try {
      await setPromotionStatus(token, promotion.id, isActive);
      feedback.success({
        title: isActive ? "Promotion turned on" : "Promotion turned off",
        description: isActive
          ? `${promotion.name} runs on its dates again.`
          : `${promotion.name} no longer lowers prices.`,
      });
      reload();
    } catch (error) {
      feedback.error({
        title: "Couldn't change the promotion",
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Promotions"
        action={
          canManage && (
            <Button asChild>
              <Link to="/app/catalog/promotions/new">
                <PlusIcon />
                New promotion
              </Link>
            </Button>
          )
        }
      />

      <ContentCard
        title={canManage ? "All promotions" : "Running now"}
        action={
          canManage && (
            <SelectInputField
              label="Status"
              hideLabel
              size="sm"
              options={statusOptions}
              value={status}
              onValueChange={(value) => setStatus(value as typeof status)}
              className="w-40"
            />
          )
        }
      >
        {loadError ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : promotions && promotions.length === 0 ? (
          <EmptyState
            title={canManage ? "No promotions here." : "No promotions running right now."}
            description={
              canManage
                ? "Set up a sale with a percent or peso discount on some or all procedures."
                : "Check back soon for discounts on lab tests."
            }
          />
        ) : (
          <Table className="min-w-176">
            <TableHeader>
              <TableRow>
                <TableHead>Promotion</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions
                ? promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell className="max-w-80 whitespace-normal">
                        <p className="font-medium text-slate-800">{promotion.name}</p>
                        {promotion.description && (
                          <p className="text-muted-foreground">{promotion.description}</p>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        {formatDiscount(promotion.discountType, promotion.value)}
                      </TableCell>
                      <TableCell>
                        {promotion.appliesTo === "all"
                          ? "All procedures"
                          : promotion.procedureIds.length === 1
                            ? "1 procedure"
                            : `${promotion.procedureIds.length} procedures`}
                      </TableCell>
                      <TableCell>{formatDateRange(promotion.startsOn, promotion.endsOn)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadge[promotion.status]}>
                          {promotionStatusLabels[promotion.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionsMenu
                          label={`Actions for ${promotion.name}`}
                          items={[
                            {
                              label: "Edit",
                              icon: <PencilIcon />,
                              hidden: !canManage,
                              onSelect: () => navigate(`/app/catalog/promotions/${promotion.id}`),
                            },
                            {
                              label: "Turn on",
                              icon: <PowerIcon />,
                              hidden: !canManage || promotion.isActive,
                              onSelect: () => void switchPromotion(promotion, true),
                            },
                            {
                              label: "Turn off",
                              icon: <PowerOffIcon />,
                              destructive: true,
                              hidden: !canManage || !promotion.isActive,
                              onSelect: () => void switchPromotion(promotion, false),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                : Array.from({ length: 3 }, (_, i) => (
                    <TableRow key={i} aria-hidden>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-9" />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </ContentCard>
    </>
  );
}
