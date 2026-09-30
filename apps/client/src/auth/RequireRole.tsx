import type { BaseRole } from "@homelabconnect/shared";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { noAccessMessage, PageMessage } from "../components/layout/PageMessage";
import { findMenuLink } from "../navigation/menu";
import { useAuth } from "./authContext";

interface RequireRoleProps {
  roles: readonly BaseRole[];
  children: ReactNode;
}

/**
 * Shows a "no access" message to users without one of the given roles. Place
 * inside RequireAuth. This is a convenience only: the API enforces access.
 * Module 2 replaces roles with permission keys.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;
  if (!roles.includes(user.role)) {
    const title = findMenuLink(pathname)?.label ?? "No access";
    return <PageMessage title={title} body={noAccessMessage} />;
  }
  return children;
}
