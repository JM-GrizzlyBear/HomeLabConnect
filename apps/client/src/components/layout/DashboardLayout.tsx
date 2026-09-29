import { useState } from "react";
import { Link, Outlet } from "react-router";
import { LogoMark } from "../icons";
import { CloseIcon, MenuIcon } from "../navIcons";
import { Sidebar } from "./Sidebar";

/** Shell for every signed-in page: sidebar on the left, the page on a light-grey canvas. */
export function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Link to="/app" className="flex items-center gap-2">
          <LogoMark className="size-7" />
          <span className="font-semibold text-slate-900">HomeLabConnect</span>
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
        >
          <MenuIcon className="size-6" />
        </button>
      </div>
      {drawerOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={closeDrawer}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeDrawer}
              className="absolute top-3 right-3 z-10 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <CloseIcon className="size-5" />
            </button>
            <Sidebar onNavigate={closeDrawer} />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}
