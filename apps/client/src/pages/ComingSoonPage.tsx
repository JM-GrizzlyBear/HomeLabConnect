import { Link, useLocation } from "react-router";
import { useAuth } from "../auth/authContext";
import { PageHeader } from "../components/layout/PageHeader";
import { NavIcon } from "../components/navIcons";
import { findMenuLink } from "../navigation/menu";

/** Placeholder for menu pages whose module isn't built yet. */
export function ComingSoonPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const entry = findMenuLink(pathname);

  if (!user) return null;

  if (!entry) {
    return <Message title="Page not found" body="This page doesn't exist." />;
  }
  if (!entry.roles.includes(user.role)) {
    return (
      <Message
        title={entry.label}
        body="You don't have access to this page. Ask an admin if you think you should."
      />
    );
  }
  return (
    <Message
      title={entry.label}
      body={`This page is coming soon. It's built in ${entry.module}.`}
    />
  );
}

function Message({ title, body }: { title: string; body: string }) {
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
