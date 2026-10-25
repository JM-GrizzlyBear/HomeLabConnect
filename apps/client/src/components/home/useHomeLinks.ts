import { useAuth } from "../../auth/authContext";

/**
 * Where the homepage's buttons go: guests create an account before booking; signed-in users
 * go straight to booking and to their account.
 */
export function useHomeLinks() {
  const { status } = useAuth();
  const signedIn = status === "signedIn";
  return {
    signedIn,
    bookPath: signedIn ? "/app/appointments/book" : "/register",
  };
}
