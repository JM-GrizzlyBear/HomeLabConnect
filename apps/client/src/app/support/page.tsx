import { requireRole } from "@/lib/auth/require-role";
import { WelcomePanel } from "@/components/welcome-panel";

export default async function SupportPage() {
  const user = await requireRole("support");
  return <WelcomePanel user={user} />;
}
