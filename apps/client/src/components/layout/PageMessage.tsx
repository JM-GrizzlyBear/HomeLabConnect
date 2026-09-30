import { Link } from "react-router";
import { NavIcon } from "../navIcons";
import { PageHeader } from "./PageHeader";

/** A whole-page message with a way back to the dashboard: coming soon, no access, not found. */
export function PageMessage({ title, body }: { title: string; body: string }) {
  return (
    <>
      <PageHeader title={title} />
      <section className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/60">
        <div className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <NavIcon name="clock" className="size-7" />
        </div>
        <p className="mt-5 max-w-md text-slate-600">{body}</p>
        <Link to="/app" className="mt-6 text-sm font-semibold text-brand-700 hover:underline">
          Back to dashboard
        </Link>
      </section>
    </>
  );
}

export const noAccessMessage =
  "You don't have access to this page. Ask an admin if you think you should.";
