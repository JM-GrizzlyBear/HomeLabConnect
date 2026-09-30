import { useLocation } from "react-router";
import { useAuth } from "../auth/authContext";
import { noAccessMessage, PageMessage } from "../components/layout/PageMessage";
import { findMenuLink } from "../navigation/menu";

/** Placeholder for menu pages whose module isn't built yet. */
export function ComingSoonPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const entry = findMenuLink(pathname);

  if (!user) return null;

  if (!entry) {
    return <PageMessage title="Page not found" body="This page doesn't exist." />;
  }
  if (!entry.roles.includes(user.role)) {
    return <PageMessage title={entry.label} body={noAccessMessage} />;
  }
  return (
    <PageMessage
      title={entry.label}
      body={`This page is coming soon. It's built in ${entry.module}.`}
    />
  );
}
