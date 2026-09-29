import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { useAuth } from "./authContext";

/** For /login and /register: a signed-in user goes straight to the app. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") return <FullPageSpinner />;
  if (status === "signedIn") return <Navigate to="/app" replace />;
  return children;
}
