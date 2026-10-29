import { ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";
import { useId, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../../auth/authContext";
import { roleLabels } from "../../auth/roleLabels";
import { type NavGroup, type NavLink as MenuLink, visibleMenu } from "../../navigation/menu";
import { ChevronIcon, NavIcon } from "../navIcons";
import { NotificationBell } from "../notifications/NotificationBell";

const itemBase =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium tracking-wide uppercase transition";

function linkClass({ isActive }: { isActive: boolean }) {
  return `${itemBase} ${
    isActive
      ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`;
}

function TopLink({ entry, onNavigate }: { entry: MenuLink; onNavigate?: () => void }) {
  return (
    <NavLink to={entry.path} end className={linkClass} onClick={onNavigate}>
      {entry.icon && <NavIcon name={entry.icon} className="size-5 shrink-0" />}
      {entry.label}
    </NavLink>
  );
}

function Group({ entry, onNavigate }: { entry: NavGroup; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const containsActive = entry.children.some((child) => pathname.startsWith(child.path));
  const [open, setOpen] = useState(containsActive);
  const panelId = useId();

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`${itemBase} ${
          containsActive
            ? "text-brand-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <NavIcon name={entry.icon} className="size-5 shrink-0" />
        <span className="flex-1 text-left">{entry.label}</span>
        <ChevronIcon className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <ul
        id={panelId}
        hidden={!open}
        className="mt-1 ml-5 space-y-1 border-l-2 border-brand-100 pl-3"
      >
        {entry.children.map((child) => (
          <li key={child.path}>
            <NavLink
              to={child.path}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-xs font-medium tracking-wide uppercase transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              {child.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </li>
  );
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

/** Profile (with an account menu) and the role's menu. `onNavigate` closes the mobile drawer. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="relative flex h-full flex-col bg-white px-5 py-8">
      <div className="absolute top-4 left-4 z-10">
        <NotificationBell onNavigate={onNavigate} />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="group flex flex-col items-center rounded-2xl p-2 text-center transition outline-none hover:bg-slate-50 focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <Avatar className="size-20 ring-4 ring-brand-400 ring-offset-4">
              {user.photoUrl && <AvatarImage src={user.photoUrl} alt="" />}
              <AvatarFallback className="bg-brand-50 text-2xl font-semibold text-brand-700">
                {initials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="mt-5 flex items-center gap-1 font-semibold text-slate-900">
              {user.firstName} {user.lastName}
              <ChevronDownIcon className="size-4 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
            </span>
            <span className="mt-0.5 max-w-full truncate text-xs text-slate-500">{user.email}</span>
            <Badge variant="secondary" className="mt-2 ring-1 ring-brand-200">
              {roleLabels[user.role]}
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          <DropdownMenuItem
            onSelect={() => {
              onNavigate?.();
              navigate("/app/profile");
            }}
          >
            <UserIcon />
            Account profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => void handleSignOut()}>
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator className="my-6 h-0.5! rounded-full bg-brand-400/60" />

      <ScrollArea className="-mx-1 min-h-0 flex-1 px-1">
        <nav aria-label="Main">
          <ul className="space-y-1">
            {visibleMenu(user.permissions).map((entry) =>
              entry.kind === "group" ? (
                <Group key={entry.label} entry={entry} onNavigate={onNavigate} />
              ) : (
                <li key={entry.path}>
                  <TopLink entry={entry} onNavigate={onNavigate} />
                </li>
              ),
            )}
          </ul>
        </nav>
      </ScrollArea>
    </div>
  );
}
