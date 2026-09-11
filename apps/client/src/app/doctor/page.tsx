import { requireRole } from "@/lib/auth/require-role";
import { WelcomePanel } from "@/components/welcome-panel";

export default async function DoctorPage() {
  const user = await requireRole("doctor");
  return <WelcomePanel user={user} />;
}
