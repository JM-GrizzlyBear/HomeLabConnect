import { InboxIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** e.g. a "Clear filters" or "Create" button. */
  action?: ReactNode;
}

/** What a list shows when it has nothing to show. */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-brand-50 text-brand-600">
          {icon ?? <InboxIcon />}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
