import { Navigate } from "react-router";
import { useAuth } from "../auth/authContext";
import { AuthLayout } from "../components/AuthLayout";
import { ChangePasswordForm } from "../forms/ChangePasswordForm";

/** Where a user signed in with a temporary password must go before anything else. */
export function ChangePasswordPage() {
  const { user, signOut } = useAuth();

  // Once the password is changed the user is updated and this sends them on to the app.
  // Everyone else changes their password from the profile page.
  if (!user?.mustChangePassword) return <Navigate to="/app" replace />;

  return (
    <AuthLayout
      title="New password"
      subtitle="You signed in with a temporary password. Choose your own to continue."
      footer={
        <>
          Not {user.firstName}?{" "}
          <button
            type="button"
            onClick={() => void signOut()}
            className="font-semibold text-brand-700 hover:underline"
          >
            Log out
          </button>
        </>
      }
    >
      <ChangePasswordForm submitLabel="Save and continue" />
    </AuthLayout>
  );
}
