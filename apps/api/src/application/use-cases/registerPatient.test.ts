import { describe, expect, it } from "vitest";
import { EmailAlreadyTaken, WeakPassword } from "../../domain/identity/identityErrors.js";
import { FakePasswordHasher, InMemoryUserRepository } from "../../test/fakes.js";
import { RegisterPatient, type RegisterPatientInput } from "./registerPatient.js";

const input: RegisterPatientInput = {
  email: "Juan@Example.com",
  password: "Password123",
  firstName: "Juan",
  lastName: "Dela Cruz",
  phone: "09171234567",
  birthDate: null,
  address: null,
};

function setup() {
  const users = new InMemoryUserRepository();
  return { users, registerPatient: new RegisterPatient(users, new FakePasswordHasher()) };
}

describe("RegisterPatient", () => {
  it("creates a patient with a normalised email and a hashed password", async () => {
    const { users, registerPatient } = setup();

    const output = await registerPatient.execute(input);

    expect(output).toMatchObject({
      email: "juan@example.com",
      role: "patient",
      firstName: "Juan",
      mustChangePassword: false,
    });
    const stored = await users.findByEmail("juan@example.com");
    expect(stored?.passwordHash).toBe("hashed:Password123");
  });

  it("rejects an email that is already registered, ignoring case", async () => {
    const { users, registerPatient } = setup();
    users.add({ email: "juan@example.com" });

    await expect(registerPatient.execute(input)).rejects.toThrow(EmailAlreadyTaken);
  });

  it("rejects a weak password", async () => {
    const { registerPatient } = setup();

    await expect(registerPatient.execute({ ...input, password: "short" })).rejects.toThrow(
      WeakPassword,
    );
  });
});
