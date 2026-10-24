import { describe, expect, it } from "vitest";
import { GetProfile } from "../../../src/application/use-cases/getProfile.js";
import { UpdateProfile } from "../../../src/application/use-cases/updateProfile.js";
import {
  PatientDetailsNotAllowed,
  PhoneRequired,
} from "../../../src/domain/identity/identityErrors.js";
import { InMemoryUserRepository } from "../../support/fakes.js";

function setup() {
  const users = new InMemoryUserRepository();
  return { users, getProfile: new GetProfile(users), updateProfile: new UpdateProfile(users) };
}

describe("GetProfile", () => {
  it("includes patient details for patients only", async () => {
    const { users, getProfile } = setup();
    const patient = users.add({ email: "juan@example.com", phone: "09171234567" });
    const doctor = users.add({ email: "doc@example.com", role: "doctor" });

    expect(await getProfile.execute({ userId: patient.id })).toMatchObject({
      email: "juan@example.com",
      phone: "09171234567",
      patient: { birthDate: null, address: null },
    });
    expect((await getProfile.execute({ userId: doctor.id })).patient).toBeNull();
  });
});

describe("UpdateProfile", () => {
  it("saves a patient's name, phone and details", async () => {
    const { users, updateProfile } = setup();
    const user = users.add({ email: "juan@example.com", phone: "09171234567" });

    const output = await updateProfile.execute({
      userId: user.id,
      firstName: "Juanito",
      lastName: "Cruz",
      phone: "09998887777",
      patient: { birthDate: "1990-05-01", address: "12 Rizal St, Makati" },
    });

    expect(output).toMatchObject({
      firstName: "Juanito",
      lastName: "Cruz",
      phone: "09998887777",
      patient: { birthDate: "1990-05-01", address: "12 Rizal St, Makati" },
    });
  });

  it("keeps patient details when none are sent", async () => {
    const { users, updateProfile } = setup();
    const user = users.add({ email: "juan@example.com", phone: "09171234567" });
    users.patients.set(user.id, { birthDate: "1990-05-01", address: "Makati" });

    const output = await updateProfile.execute({
      userId: user.id,
      firstName: "Juan",
      lastName: "Cruz",
      phone: "09171234567",
      patient: null,
    });

    expect(output.patient).toEqual({ birthDate: "1990-05-01", address: "Makati" });
  });

  it("lets staff clear their phone but not set patient details", async () => {
    const { users, updateProfile } = setup();
    const user = users.add({ email: "doc@example.com", role: "doctor", phone: "09171234567" });
    const input = { userId: user.id, firstName: "Doc", lastName: "Reyes", phone: null };

    expect((await updateProfile.execute({ ...input, patient: null })).phone).toBeNull();
    await expect(
      updateProfile.execute({ ...input, patient: { birthDate: null, address: "Makati" } }),
    ).rejects.toThrow(PatientDetailsNotAllowed);
  });

  it("requires patients to keep a phone number", async () => {
    const { users, updateProfile } = setup();
    const user = users.add({ email: "juan@example.com", phone: "09171234567" });

    await expect(
      updateProfile.execute({
        userId: user.id,
        firstName: "Juan",
        lastName: "Cruz",
        phone: null,
        patient: null,
      }),
    ).rejects.toThrow(PhoneRequired);
  });
});
