import type { MedTeam } from "@homelabconnect/shared";
import { addDays, format, parseISO } from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CopyIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { ActionsMenu } from "@/components/ActionsMenu";
import { EmptyState } from "@/components/data/EmptyState";
import { RosterDialog } from "@/components/scheduling/RosterDialog";
import { TeamDialog, type TeamDialogTarget } from "@/components/scheduling/TeamDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../api/apiClient";
import { copyPreviousRosters, fetchTeamBoard, setTeamStatus } from "../api/scheduling";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";

/** "2026-10-05", "2026-10-18" → "Oct 5 – Oct 18, 2026". */
function formatPeriod(start: string, end: string): string {
  return `${format(parseISO(start), "MMM d")} – ${format(parseISO(end), "MMM d, yyyy")}`;
}

const shiftDays = (date: string, days: number) =>
  format(addDays(parseISO(date), days), "yyyy-MM-dd");

/** Med teams and who is on each one, two weeks at a time. */
export function TeamsPage() {
  const feedback = useFeedback();
  const can = useCan();
  const canRoster = can("teams.roster");
  const canManage = can("teams.manage");
  /** Any day in the period being viewed; null = today. */
  const [date, setDate] = useState<string | null>(null);
  const [editingRoster, setEditingRoster] = useState<MedTeam | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamDialogTarget>(null);
  const {
    data: board,
    error,
    reload,
  } = useApiQuery(queryKeys.teams(date), (signal) => fetchTeamBoard(date, signal), {
    errorMessage: "Could not load the teams. Try again.",
  });

  const periodLabel = board ? formatPeriod(board.periodStart, board.periodEnd) : "";
  const hasRosters = board?.teams.some((team) => team.members.length > 0) ?? false;

  async function copyPrevious() {
    if (!board) return;
    try {
      const copied = await copyPreviousRosters(board.periodStart);
      feedback.success({
        title: copied ? "Rosters copied" : "Nothing to copy",
        description: copied
          ? `${copied} ${copied === 1 ? "team carries" : "teams carry"} on into ${periodLabel}.`
          : "The previous two weeks had no rosters.",
      });
      reload();
    } catch (failure) {
      feedback.error({
        title: "Couldn't copy the rosters",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  async function switchTeam(team: MedTeam, isActive: boolean) {
    if (!isActive) {
      const confirmed = await feedback.confirm({
        title: `Deactivate ${team.name}?`,
        description: "It won't get rosters or visits. Past rosters are kept.",
        confirmLabel: "Deactivate",
        destructive: true,
      });
      if (!confirmed) return;
    }
    try {
      await setTeamStatus(team.id, isActive);
      feedback.success({ title: isActive ? "Team reactivated" : "Team deactivated" });
      reload();
    } catch (failure) {
      feedback.error({
        title: "Couldn't change the team",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Med Teams"
        action={
          canManage && (
            <Button onClick={() => setEditingTeam("new")}>
              <PlusIcon />
              New team
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous two weeks"
            disabled={!board}
            onClick={() => board && setDate(shiftDays(board.periodStart, -14))}
          >
            <ChevronLeftIcon />
          </Button>
          <p className="min-w-52 text-center text-sm font-medium text-slate-800" aria-live="polite">
            {periodLabel || "Loading…"}
          </p>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next two weeks"
            disabled={!board}
            onClick={() => board && setDate(shiftDays(board.periodStart, 14))}
          >
            <ChevronRightIcon />
          </Button>
          {date && (
            <Button variant="link" size="sm" onClick={() => setDate(null)}>
              This period
            </Button>
          )}
        </div>
        {canRoster && board && !hasRosters && (
          <Button variant="outline" size="sm" onClick={() => void copyPrevious()}>
            <CopyIcon />
            Copy previous two weeks
          </Button>
        )}
      </div>

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !board ? (
        <div className="grid gap-4 md:grid-cols-2" aria-label="Loading the teams">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : board.teams.length === 0 ? (
        <EmptyState
          title="No med teams yet."
          description="Add a team, then choose who's on it for each two weeks."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {board.teams.map((team) => (
            <ContentCard
              key={team.id}
              title={team.name}
              action={
                <ActionsMenu
                  label={`Actions for ${team.name}`}
                  items={[
                    {
                      label: "Edit roster",
                      icon: <UsersIcon />,
                      hidden: !canRoster || !team.isActive,
                      onSelect: () => setEditingRoster(team),
                    },
                    {
                      label: "Rename",
                      icon: <PencilIcon />,
                      hidden: !canManage,
                      onSelect: () => setEditingTeam(team),
                    },
                    {
                      label: "Reactivate",
                      icon: <PowerIcon />,
                      hidden: !canManage || team.isActive,
                      onSelect: () => void switchTeam(team, true),
                    },
                    {
                      label: "Deactivate",
                      icon: <PowerOffIcon />,
                      destructive: true,
                      hidden: !canManage || !team.isActive,
                      onSelect: () => void switchTeam(team, false),
                    },
                  ]}
                />
              }
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {team.area && <span>{team.area}</span>}
                {!team.isActive && <Badge variant="muted">Inactive</Badge>}
              </div>
              {team.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nobody on this team for these two weeks.
                </p>
              ) : (
                <ul className="grid gap-1.5">
                  {team.members.map((member) => (
                    <li key={member.id} className="flex items-center gap-2 text-sm text-slate-800">
                      {member.name}
                      {team.lead?.id === member.id && <Badge variant="success">Lead</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </ContentCard>
          ))}
        </div>
      )}

      {board && board.unassigned.length > 0 && (
        <ContentCard title="Not on a team" className="mt-6">
          <p className="text-sm text-slate-700">
            {board.unassigned.map((person) => person.name).join(", ")}
          </p>
        </ContentCard>
      )}

      {board && (
        <RosterDialog
          team={editingRoster}
          periodStart={board.periodStart}
          periodLabel={periodLabel}
          onClose={() => setEditingRoster(null)}
          onSaved={reload}
        />
      )}
      <TeamDialog target={editingTeam} onClose={() => setEditingTeam(null)} onSaved={reload} />
    </>
  );
}
