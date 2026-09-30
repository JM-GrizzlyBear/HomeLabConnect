import type { PermissionKey } from "@homelabconnect/shared";
import { useCallback } from "react";
import { useAuth } from "./authContext";

/**
 * `can("users.create")`: whether the signed-in user has a permission. Use it to
 * hide buttons and actions; the API still enforces every check.
 */
export function useCan(): (permission: PermissionKey) => boolean {
  const { user } = useAuth();
  return useCallback(
    (permission: PermissionKey) => user?.permissions.includes(permission) ?? false,
    [user],
  );
}
