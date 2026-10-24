import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

describe("PUT /api/auth/password", () => {
  it("changes the password, keeps this session and signs out the others", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com" });
    const auth = await signIn(app, "juan@example.com");
    const otherAuth = await signIn(app, "juan@example.com");

    const res = await request(app)
      .put("/api/auth/password")
      .set(auth)
      .send({ currentPassword: "Password123", newPassword: "NewPassword456" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: "juan@example.com", mustChangePassword: false });
    const me = (t: Record<string, string>) => request(app).get("/api/auth/me").set(t);
    expect((await me(auth)).status).toBe(200);
    expect((await me(otherAuth)).status).toBe(401);
    // Throws if the new password is refused
    await signIn(app, "juan@example.com", "NewPassword456");
  });

  it("is allowed with a temporary password and unlocks the other routes", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "new@example.com", role: "support", mustChangePassword: true });
    const auth = await signIn(app, "new@example.com");
    const profile = () => request(app).get("/api/users/me/profile").set(auth);

    expect((await profile()).body.error.code).toBe("password_change_required");

    const res = await request(app)
      .put("/api/auth/password")
      .set(auth)
      .send({ currentPassword: "Password123", newPassword: "NewPassword456" });

    expect(res.body.mustChangePassword).toBe(false);
    expect((await profile()).status).toBe(200);
  });

  it("returns 400 for a wrong current password", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com" });
    const auth = await signIn(app, "juan@example.com");

    const res = await request(app)
      .put("/api/auth/password")
      .set(auth)
      .send({ currentPassword: "Wrong1234", newPassword: "NewPassword456" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("incorrect_current_password");
  });

  it("returns 400 for a weak new password", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com" });
    const auth = await signIn(app, "juan@example.com");

    const res = await request(app)
      .put("/api/auth/password")
      .set(auth)
      .send({ currentPassword: "Password123", newPassword: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error.issues[0].path).toBe("newPassword");
  });

  it("returns 401 when nobody is signed in", async () => {
    const res = await request((await buildTestApp()).app)
      .put("/api/auth/password")
      .send({ currentPassword: "Password123", newPassword: "NewPassword456" });
    expect(res.status).toBe(401);
  });
});

describe("/api/users/me/profile", () => {
  it("returns and updates a patient's profile", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com", firstName: "Juan", phone: "09171234567" });
    const auth = await signIn(app, "juan@example.com");

    const before = await request(app).get("/api/users/me/profile").set(auth);
    const after = await request(app)
      .patch("/api/users/me/profile")
      .set(auth)
      .send({
        firstName: "Juanito",
        lastName: "Cruz",
        phone: "09998887777",
        patient: { birthDate: "1990-05-01", address: "12 Rizal St, Makati" },
      });

    expect(before.status).toBe(200);
    expect(before.body).toMatchObject({
      email: "juan@example.com",
      firstName: "Juan",
      patient: { birthDate: null, address: null },
    });
    expect(before.body).not.toHaveProperty("passwordHash");
    expect(after.status).toBe(200);
    expect(after.body).toMatchObject({
      firstName: "Juanito",
      phone: "09998887777",
      patient: { birthDate: "1990-05-01", address: "12 Rizal St, Makati" },
    });
  });

  it("returns 400 when staff send patient details", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "doc@example.com", role: "doctor" });
    const auth = await signIn(app, "doc@example.com");

    const res = await request(app)
      .patch("/api/users/me/profile")
      .set(auth)
      .send({
        firstName: "Doc",
        lastName: "Reyes",
        phone: null,
        patient: { birthDate: null, address: "Makati" },
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("patient_details_not_allowed");
  });

  it("returns 400 with the failing fields for an invalid body", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com", phone: "09171234567" });
    const auth = await signIn(app, "juan@example.com");

    const res = await request(app)
      .patch("/api/users/me/profile")
      .set(auth)
      .send({ firstName: "", lastName: "Cruz", phone: "123" });

    expect(res.status).toBe(400);
    expect(res.body.error.issues.map((issue: { path: string }) => issue.path)).toEqual(
      expect.arrayContaining(["firstName", "phone"]),
    );
  });

  it("returns 401 when nobody is signed in", async () => {
    const res = await request((await buildTestApp()).app).get("/api/users/me/profile");
    expect(res.status).toBe(401);
  });
});
