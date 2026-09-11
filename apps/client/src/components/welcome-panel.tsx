import type { PublicUser } from "@homelabconnect/shared";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/auth/roles";
import { signOutAction } from "@/lib/auth/actions";

export function WelcomePanel({ user }: { user: PublicUser }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-primary">
        Welcome {roleLabel(user.role)}
      </h1>
      <p className="text-muted-foreground">
        {user.firstName} {user.lastName}
      </p>
      {/* TODO: role-specific dashboard content */}
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
}
