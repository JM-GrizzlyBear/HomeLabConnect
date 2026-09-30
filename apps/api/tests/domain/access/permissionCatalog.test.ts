import {
  defaultBaseGrants,
  isPermissionKey,
  PERMISSION_KEYS,
  permissionModules,
} from "@homelabconnect/shared";
import { describe, expect, it } from "vitest";

// The catalogue in packages/shared is what the seed, API and client all use.
describe("permission catalogue", () => {
  it("has the 21 modules and 67 permissions from the system design", () => {
    expect(permissionModules).toHaveLength(21);
    expect(PERMISSION_KEYS).toHaveLength(67);
  });

  it("names every key <module>.<action>, with no duplicates", () => {
    for (const module of permissionModules) {
      for (const { key } of module.permissions) {
        expect(key).toMatch(new RegExp(`^${module.id}\\.[a-z_]+$`));
      }
    }
    expect(new Set(PERMISSION_KEYS).size).toBe(PERMISSION_KEYS.length);
  });

  it("only grants real keys by default, each once", () => {
    for (const grants of Object.values(defaultBaseGrants)) {
      expect(grants.every(isPermissionKey)).toBe(true);
      expect(new Set(grants).size).toBe(grants.length);
    }
  });
});
