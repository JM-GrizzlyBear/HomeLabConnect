import { EllipsisIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionItem {
  label: string;
  icon?: ReactNode;
  onSelect(): void;
  /** Red, for actions like deactivating. Pair it with a confirm dialog. */
  destructive?: boolean;
  /** Leave the item out, e.g. "Deactivate" on an already inactive user. */
  hidden?: boolean;
}

interface ActionsMenuProps {
  /** Accessible name of the "⋯" button, e.g. "Actions for Ana Reyes". */
  label: string;
  items: readonly ActionItem[];
  size?: "icon-xs" | "icon-sm" | "icon";
}

/** A "⋯" button opening a menu of row actions. Renders nothing when every item is hidden. */
export function ActionsMenu({ label, items, size = "icon-sm" }: ActionsMenuProps) {
  const visible = items.filter((item) => !item.hidden);
  if (visible.length === 0) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} aria-label={label}>
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {visible.map((item) => (
          <DropdownMenuItem
            key={item.label}
            variant={item.destructive ? "destructive" : "default"}
            onSelect={item.onSelect}
          >
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
