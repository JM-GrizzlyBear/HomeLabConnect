import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { roleToPath } from "@/lib/auth/roles";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? roleToPath(user.role) : "/login");
}
