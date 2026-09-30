import type { PermissionKey } from "@homelabconnect/shared";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { noAccessMessage, PageMessage } from "../components/layout/PageMessage";
import { findMenuLink } from "../navigation/menu";
import { useCan } from "./useCan";

interface RequirePermissionProps {
  permission: PermissionKey;
  children: ReactNode;
}

/**
 * Shows a "no access" message to users without the permission. Place inside
 * RequireAuth. This is a convenience only: the API enforces access.
 */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const can = useCan();
  const { pathname } = useLocation();

  if (!can(permission)) {
    const title = findMenuLink(pathname)?.label ?? "No access";
    return <PageMessage title={title} body={noAccessMessage} />;
  }
  return children;
}
