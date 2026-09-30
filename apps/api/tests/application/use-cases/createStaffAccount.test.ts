import { describe, expect, it } from "vitest";
import { CreateStaffAccount } from "../../../src/application/use-cases/createStaffAccount.js";
import { EmailAlreadyTaken, NotAStaffRole } from "../../../src/domain/identity/identityErrors.js";
import {
  FakeAccountEmails,
  FakePasswordHasher,
  FakeTemporaryPasswordGenerator,
  FixedClock,
  InMemoryUserRepository,
} from "../../support/fakes.js";

function setup() {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const emails = new FakeAccountEmails();
  const createStaffAccount = new CreateStaffAccount(
    users,
    new FakePasswordHasher(),
    new FakeTemporaryPasswordGenerator(),
    emails,
    clock,
  );
  return { clock, users, emails, createStaffAccount };
}

const input = {
  email: " Ana.Reyes@Example.com ",
  firstName: "Ana",
  lastName: "Reyes",
  phone: null,
  role: "support",
  hiredOn: "2026-01-10",
};

describe("CreateStaffAccount", () => {
  it("creates the account on a temporary password that expires in 7 days", async () => {
    const { users, createStaffAccount } = setup();

    const output = await createStaffAccount.execute(input);

    const stored = users.users.get(output.user.id);
    expect(stored).toMatchObject({
      email: "ana.reyes@example.com",
      role: "support",
      passwordHash: "hashed:Temp0001",
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date("2026-01-22T08:00:00Z"),
    });
    expect(users.hiredOn.get(output.user.id)).toBe("2026-01-10");
    expect(output).toMatchObject({
      emailSent: true,
      temporaryPassword: null,
      temporaryPasswordExpiresAt: new Date("2026-01-22T08:00:00Z"),
    });
  });

  it("emails the temporary password to the new user", async () => {
    const { emails, createStaffAccount } = setup();

    await createStaffAccount.execute(input);

    expect(emails.sent).toEqual([
      {
        kind: "welcome",
        to: "ana.reyes@example.com",
        firstName: "Ana",
        temporaryPassword: "Temp0001",
        expiresAt: new Date("2026-01-22T08:00:00Z"),
      },
    ]);
  });

  it("keeps the account and hands the password to the admin when the email fails", async () => {
    const { users, emails, createStaffAccount } = setup();
    emails.failing = true;

    const output = await createStaffAccount.execute(input);

    expect(output).toMatchObject({ emailSent: false, temporaryPassword: "Temp0001" });
    expect(users.users.has(output.user.id)).toBe(true);
  });

  it("rejects a duplicate email", async () => {
    const { users, createStaffAccount } = setup();
    users.add({ email: "ana.reyes@example.com" });

    await expect(createStaffAccount.execute(input)).rejects.toThrow(EmailAlreadyTaken);
  });

  it("rejects the patient role", async () => {
    const { createStaffAccount } = setup();

    await expect(createStaffAccount.execute({ ...input, role: "patient" })).rejects.toThrow(
      NotAStaffRole,
    );
  });
});
