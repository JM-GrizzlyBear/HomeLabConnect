import type { ComponentStatus } from "@homelabconnect/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchHealth } from "../api/health";

type Status = ComponentStatus | "checking" | "unreachable";

function StatusBadge({ label, status }: { label: string; status: Status }) {
  const color =
    status === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : status === "checking"
        ? "bg-slate-100 text-slate-600"
        : "bg-rose-100 text-rose-800";
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${color}`}>
      {label}: {status}
    </span>
  );
}

export function HomePage() {
  // Both come from the same request, so they change together.
  const [{ api, db }, setStatus] = useState<{ api: Status; db: Status }>({
    api: "checking",
    db: "checking",
  });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const health = await fetchHealth(controller.signal);
        setStatus({ api: health.status, db: health.db });
      } catch {
        if (!controller.signal.aborted) setStatus({ api: "unreachable", db: "unreachable" });
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">HomeLabConnect</h1>
        <p className="mt-2 text-slate-600">Home laboratory service platform</p>
        <div className="mt-6 flex justify-center gap-3">
          <StatusBadge label="API" status={api} />
          <StatusBadge label="DB" status={db} />
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/login"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
