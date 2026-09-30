import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  title: string;
  /** Top-right slot, e.g. a button. */
  action?: ReactNode;
  /** Marks cards that still show made-up numbers. */
  sample?: boolean;
  className?: string;
  children: ReactNode;
}

/** A titled white panel: the building block of dashboard and form pages. */
export function ContentCard({
  title,
  action,
  sample = false,
  className,
  children,
}: ContentCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl shadow-sm ring-slate-200/60 [--card-spacing:--spacing(6)]",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="font-medium text-slate-800">
          <h2>{title}</h2>
        </CardTitle>
        {(sample || action) && (
          <CardAction>
            {sample ? (
              <Badge variant="warning" className="text-[10px] tracking-wide uppercase">
                Sample data
              </Badge>
            ) : (
              action
            )}
          </CardAction>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
