import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { useAuth } from "./authContext";

/** Renders its children only for a signed-in user; otherwise sends them to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageSpinner />;
  if (status === "signedOut") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
