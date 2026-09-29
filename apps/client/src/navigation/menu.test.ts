import { describe, expect, it } from "vitest";
import { findMenuLink, type NavEntry, visibleMenu } from "./menu";

const labels = (entries: NavEntry[]) =>
  entries.map((entry) =>
    entry.kind === "group"
      ? `${entry.label}: ${entry.children.map((c) => c.label).join(", ")}`
      : entry.label,
  );

describe("visibleMenu", () => {
  it("shows admins the Users group with All Users, Create Staff and Reports", () => {
    expect(labels(visibleMenu("admin"))).toContain("Users: All Users, Create Staff, Reports");
  });

  it("hides staff-only modules from patients", () => {
    const menu = labels(visibleMenu("patient"));
    expect(menu).toEqual([
      "Dashboard",
      "Appointments: Book a Visit, My Appointments",
      "Results: My Results",
      "Payments: My Payments",
      "Support: My Tickets",
      "Account Profile",
    ]);
  });

  it("shows doctors only their review queue under Results", () => {
    expect(labels(visibleMenu("doctor"))).toEqual([
      "Dashboard",
      "Results: Review Queue",
      "Account Profile",
    ]);
  });

  it("drops groups with no visible children", () => {
    const entries: NavEntry[] = [
      {
        kind: "group",
        label: "Admin only",
        icon: "users",
        children: [{ kind: "link", label: "X", path: "/x", roles: ["admin"], module: "M" }],
      },
    ];
    expect(visibleMenu("patient", entries)).toEqual([]);
  });
});

describe("findMenuLink", () => {
  it("finds nested and top-level links by path", () => {
    expect(findMenuLink("/app/users/all")?.label).toBe("All Users");
    expect(findMenuLink("/app/profile")?.label).toBe("Account Profile");
    expect(findMenuLink("/app/nope")).toBeUndefined();
  });
});
