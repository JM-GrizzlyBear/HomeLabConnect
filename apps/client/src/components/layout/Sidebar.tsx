import { useId, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../auth/authContext";
import { roleLabels } from "../../auth/roleLabels";
import { type NavGroup, type NavLink as MenuLink, visibleMenu } from "../../navigation/menu";
import { ChevronIcon, NavIcon } from "../navIcons";

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

/** Profile, the role's menu, and log out. `onNavigate` closes the mobile drawer. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-full flex-col bg-white px-5 py-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-brand-50 text-2xl font-semibold text-brand-700 ring-4 ring-brand-400 ring-offset-4">
          {initials(user.firstName, user.lastName)}
        </div>
        <p className="mt-5 font-semibold text-slate-900">
          {user.firstName} {user.lastName}
        </p>
        <p className="mt-0.5 max-w-full truncate text-xs text-slate-500">{user.email}</p>
        <span className="mt-2 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-brand-200">
          {roleLabels[user.role]}
        </span>
      </div>

      <div className="my-6 h-0.5 rounded-full bg-brand-400/60" />

      <nav aria-label="Main" className="-mx-1 flex-1 overflow-y-auto px-1">
        <ul className="space-y-1">
          {visibleMenu(user.role).map((entry) =>
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

      <div className="my-6 h-0.5 rounded-full bg-brand-400/60" />

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="mx-auto w-40 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold tracking-wide text-white uppercase shadow-md shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
      >
        {signingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
