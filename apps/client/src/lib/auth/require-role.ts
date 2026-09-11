import { redirect } from "next/navigation";
import type { PublicUser, Role } from "@homelabconnect/shared";
import { getCurrentUser } from "@/lib/auth/session";
import { roleToPath } from "@/lib/auth/roles";

export async function requireRole(expected: Role): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== expected) redirect(roleToPath(user.role));
  return user;
}
