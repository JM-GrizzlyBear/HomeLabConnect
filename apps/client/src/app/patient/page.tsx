import { requireRole } from "@/lib/auth/require-role";
import { WelcomePanel } from "@/components/welcome-panel";

export default async function PatientPage() {
  const user = await requireRole("patient");
  return <WelcomePanel user={user} />;
}
