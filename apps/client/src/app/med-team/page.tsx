import { requireRole } from "@/lib/auth/require-role";
import { WelcomePanel } from "@/components/welcome-panel";

export default async function MedTeamPage() {
  const user = await requireRole("med_team");
  return <WelcomePanel user={user} />;
}
