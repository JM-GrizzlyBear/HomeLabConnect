"use server";

import { redirect } from "next/navigation";
import { LoginInputSchema, type Role } from "@homelabconnect/shared";
import { createApiClient } from "@/lib/orpc/client";
import { setSessionCookie } from "@/lib/auth/session";
import { roleToPath } from "@/lib/auth/roles";

export interface LoginActionResult {
  error?: string;
}

export async function loginAction(
  formData: FormData,
): Promise<LoginActionResult> {
  const parsed = LoginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let token: string;
  let role: Role;
  try {
    const result = await createApiClient().auth.login(parsed.data);
    token = result.token;
    role = result.user.role;
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Invalid email or password",
    };
  }

  await setSessionCookie(token);
  redirect(roleToPath(role));
}
