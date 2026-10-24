import { defaultBaseGrants, PERMISSION_KEYS } from "@homelabconnect/shared";
import { describe, expect, it } from "vitest";
import { findMenuLink, type NavEntry, visibleMenu } from "../../src/navigation/menu";

const labels = (entries: NavEntry[]) =>
  entries.map((entry) =>
    entry.kind === "group"
      ? `${entry.label}: ${entry.children.map((c) => c.label).join(", ")}`
      : entry.label,
  );

describe("visibleMenu", () => {
  it("shows admins (every permission) the whole Users group", () => {
    expect(labels(visibleMenu(PERMISSION_KEYS))).toContain(
      "Users: All Users, Create Staff, Roles & Permissions, Reports",
    );
  });

  it("gives patients only their own pages", () => {
    expect(labels(visibleMenu(defaultBaseGrants.patient))).toEqual([
      "Dashboard",
      "Appointments: Book a Visit, My Appointments",
      "Results: My Results",
      "Payments: My Payments",
      "Support: My Tickets",
      "Catalog: Procedures, Promotions",
      "Account Profile",
    ]);
  });

  it("gives doctors all appointments, the review queue and the catalogue", () => {
    expect(labels(visibleMenu(defaultBaseGrants.doctor))).toEqual([
      "Dashboard",
      "Appointments: All Appointments",
      "Results: Review Queue",
      "Scheduling: My Schedule, My Leave, Holidays & Closed Days",
      "Catalog: Procedures",
      "Account Profile",
    ]);
  });

  it("follows permissions, not roles: one extra key reveals one extra page", () => {
    const support = labels(visibleMenu(defaultBaseGrants.support));
    expect(support).toContain("Users: All Users");

    const withCreate = labels(visibleMenu([...defaultBaseGrants.support, "users.create"]));
    expect(withCreate).toContain("Users: All Users, Create Staff");
  });

  it("shows entries without a permission to everyone, and drops empty groups", () => {
    const entries: NavEntry[] = [
      {
        kind: "group",
        label: "Admin only",
        icon: "users",
        children: [
          { kind: "link", label: "X", path: "/x", permission: "settings.manage", module: "M" },
        ],
      },
      { kind: "link", label: "Profile", path: "/p", permission: null, module: "M" },
    ];
    expect(labels(visibleMenu([], entries))).toEqual(["Profile"]);
  });
});

describe("findMenuLink", () => {
  it("finds nested and top-level links by path", () => {
    expect(findMenuLink("/app/users/all")?.label).toBe("All Users");
    expect(findMenuLink("/app/profile")?.label).toBe("Account Profile");
    expect(findMenuLink("/app/nope")).toBeUndefined();
  });
});
