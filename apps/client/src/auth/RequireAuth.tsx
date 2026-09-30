import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { useAuth } from "./authContext";

interface RequireAuthProps {
  /** Let a user on a temporary password through. Only for the change-password page. */
  allowPendingPasswordChange?: boolean;
  children: ReactNode;
}

/**
 * Renders its children only for a signed-in user; otherwise sends them to /login.
 * A user still on a temporary password is sent to /change-password first.
 */
export function RequireAuth({ allowPendingPasswordChange = false, children }: RequireAuthProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageSpinner />;
  if (status === "signedOut") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (user?.mustChangePassword && !allowPendingPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }
  return children;
}
