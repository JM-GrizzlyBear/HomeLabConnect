import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../../support/testApp.js";

type App = ReturnType<typeof buildTestApp>["app"];

async function loginAs(app: App, email: string, password = "Password123") {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token as string;
}

describe("PUT /api/auth/password", () => {
  it("changes the password, keeps this session and signs out the others", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com" });
    const token = await loginAs(app, "juan@example.com");
    const otherToken = await loginAs(app, "juan@example.com");

    const res = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password123", newPassword: "NewPassword456" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: "juan@example.com", mustChangePassword: false });
    const me = (t: string) => request(app).get("/api/auth/me").set("Authorization", `Bearer ${t}`);
    expect((await me(token)).status).toBe(200);
    expect((await me(otherToken)).status).toBe(401);
    expect(await loginAs(app, "juan@example.com", "NewPassword456")).toEqual(expect.any(String));
  });

  it("is allowed with a temporary password and unlocks the other routes", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "new@example.com", role: "support", mustChangePassword: true });
    const token = await loginAs(app, "new@example.com");
    const profile = () =>
      request(app).get("/api/users/me/profile").set("Authorization", `Bearer ${token}`);

    expect((await profile()).body.error.code).toBe("password_change_required");

    const res = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password123", newPassword: "NewPassword456" });

    expect(res.body.mustChangePassword).toBe(false);
    expect((await profile()).status).toBe(200);
  });

  it("returns 400 for a wrong current password", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com" });
    const token = await loginAs(app, "juan@example.com");

    const res = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Wrong1234", newPassword: "NewPassword456" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("incorrect_current_password");
  });

  it("returns 400 for a weak new password", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com" });
    const token = await loginAs(app, "juan@example.com");

    const res = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password123", newPassword: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error.issues[0].path).toBe("newPassword");
  });

  it("returns 401 without a token", async () => {
    const res = await request(buildTestApp().app)
      .put("/api/auth/password")
      .send({ currentPassword: "Password123", newPassword: "NewPassword456" });
    expect(res.status).toBe(401);
  });
});

describe("/api/users/me/profile", () => {
  it("returns and updates a patient's profile", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com", firstName: "Juan", phone: "09171234567" });
    const token = await loginAs(app, "juan@example.com");

    const before = await request(app)
      .get("/api/users/me/profile")
      .set("Authorization", `Bearer ${token}`);
    const after = await request(app)
      .patch("/api/users/me/profile")
      .set("Authorization", `Bearer ${token}`)
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
    const { app, users } = buildTestApp();
    users.add({ email: "doc@example.com", role: "doctor" });
    const token = await loginAs(app, "doc@example.com");

    const res = await request(app)
      .patch("/api/users/me/profile")
      .set("Authorization", `Bearer ${token}`)
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
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com", phone: "09171234567" });
    const token = await loginAs(app, "juan@example.com");

    const res = await request(app)
      .patch("/api/users/me/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "", lastName: "Cruz", phone: "123" });

    expect(res.status).toBe(400);
    expect(res.body.error.issues.map((issue: { path: string }) => issue.path)).toEqual(
      expect.arrayContaining(["firstName", "phone"]),
    );
  });

  it("returns 401 without a token", async () => {
    const res = await request(buildTestApp().app).get("/api/users/me/profile");
    expect(res.status).toBe(401);
  });
});
