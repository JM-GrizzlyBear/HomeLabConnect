import { describe, expect, it } from "vitest";
import { ListUsers } from "../../../../src/application/identity/ListUsers.js";
import { InMemoryUserRepository } from "../../../support/fakes.js";

function setup() {
  const users = new InMemoryUserRepository();
  users.add({ email: "juan@example.com", firstName: "Juan", lastName: "Cruz" });
  users.add({ email: "ana@example.com", firstName: "Ana", role: "support" });
  users.add({ email: "doc@example.com", role: "doctor", isActive: false });
  return { users, listUsers: new ListUsers(users) };
}

const all = { search: null, role: null, isActive: null, page: 1, pageSize: 20 };

describe("ListUsers", () => {
  it("lists every user newest first, without password hashes", async () => {
    const { listUsers } = setup();

    const output = await listUsers.execute(all);

    expect(output.total).toBe(3);
    expect(output.items.map((item) => item.email)).toEqual([
      "doc@example.com",
      "ana@example.com",
      "juan@example.com",
    ]);
    expect(output.items[0]).not.toHaveProperty("passwordHash");
  });

  it("filters by search text, role and status", async () => {
    const { listUsers } = setup();

    const bySearch = await listUsers.execute({ ...all, search: "  CRUZ " });
    const byRole = await listUsers.execute({ ...all, role: "support" });
    const inactive = await listUsers.execute({ ...all, isActive: false });

    expect(bySearch.items.map((item) => item.email)).toEqual(["juan@example.com"]);
    expect(byRole.items.map((item) => item.email)).toEqual(["ana@example.com"]);
    expect(inactive.items.map((item) => item.email)).toEqual(["doc@example.com"]);
  });

  it("pages the results and reports the full total", async () => {
    const { listUsers } = setup();

    const output = await listUsers.execute({ ...all, page: 2, pageSize: 2 });

    expect(output).toMatchObject({ total: 3, page: 2, pageSize: 2 });
    expect(output.items.map((item) => item.email)).toEqual(["juan@example.com"]);
  });
});
