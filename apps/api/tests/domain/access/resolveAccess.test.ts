import { describe, expect, it } from "vitest";
import {
  type AccessData,
  decidePermission,
  effectivePermissions,
} from "../../../src/domain/access/resolveAccess.js";

const now = new Date("2026-01-15T08:00:00Z");
const later = new Date("2026-01-16T08:00:00Z");
const earlier = new Date("2026-01-14T08:00:00Z");

function access(overrides: Partial<AccessData> = {}): AccessData {
  return {
    baseRole: "support",
    allPermissions: ["users.view", "users.create", "payments.refund"],
    baseGrants: ["users.view"],
    customRole: [],
    overrides: [],
    ...overrides,
  };
}

describe("decidePermission", () => {
  it.each<[string, Partial<AccessData>, string, boolean, string]>([
    ["base role grant", {}, "users.view", true, "base_role"],
    ["nothing grants it", {}, "users.create", false, "none"],
    [
      "custom role grant beats base",
      { customRole: [{ key: "users.create", effect: "grant" }] },
      "users.create",
      true,
      "custom_role",
    ],
    [
      "custom role deny beats base grant",
      { customRole: [{ key: "users.view", effect: "deny" }] },
      "users.view",
      false,
      "custom_role",
    ],
    [
      "override beats custom role",
      {
        customRole: [{ key: "users.create", effect: "deny" }],
        overrides: [{ key: "users.create", effect: "grant", expiresAt: null }],
      },
      "users.create",
      true,
      "override",
    ],
    [
      "override deny beats base grant",
      { overrides: [{ key: "users.view", effect: "deny", expiresAt: later }] },
      "users.view",
      false,
      "override",
    ],
    [
      "expired override is ignored",
      { overrides: [{ key: "users.create", effect: "grant", expiresAt: earlier }] },
      "users.create",
      false,
      "none",
    ],
    [
      "override ending exactly now is expired",
      { overrides: [{ key: "users.create", effect: "grant", expiresAt: now }] },
      "users.create",
      false,
      "none",
    ],
    [
      "admin has everything",
      { baseRole: "admin", baseGrants: [] },
      "payments.refund",
      true,
      "base_role",
    ],
    [
      "a custom role can still deny an admin",
      { baseRole: "admin", customRole: [{ key: "payments.refund", effect: "deny" }] },
      "payments.refund",
      false,
      "custom_role",
    ],
  ])("%s", (_case, data, key, granted, source) => {
    expect(decidePermission(access(data), key, now)).toEqual({ granted, source });
  });
});

describe("effectivePermissions", () => {
  it("lists the granted keys, sorted", () => {
    const data = access({
      baseGrants: ["users.view"],
      overrides: [{ key: "payments.refund", effect: "grant", expiresAt: null }],
    });

    expect(effectivePermissions(data, now)).toEqual(["payments.refund", "users.view"]);
  });

  it("gives an admin every permission in the catalogue", () => {
    expect(effectivePermissions(access({ baseRole: "admin" }), now)).toEqual([
      "payments.refund",
      "users.create",
      "users.view",
    ]);
  });
});
