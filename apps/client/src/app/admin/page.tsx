import { requireRole } from "@/lib/auth/require-role";
import { WelcomePanel } from "@/components/welcome-panel";

export default async function AdminPage() {
  const user = await requireRole("admin");
  return <WelcomePanel user={user} />;
}
