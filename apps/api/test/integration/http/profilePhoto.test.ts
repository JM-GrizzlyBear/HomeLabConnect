import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

async function signedIn() {
  const testApp = await buildTestApp();
  await testApp.given.user({ email: "juan@example.com" });
  return { ...testApp, auth: await signIn(testApp.app, "juan@example.com") };
}

describe("/api/users/me/photo", () => {
  it("uploads a photo that then shows on the signed-in user, and replaces it", async () => {
    const { app, auth, photos } = await signedIn();

    const first = await request(app)
      .put("/api/users/me/photo")
      .set(auth)
      .attach("photo", PNG, { filename: "me.png", contentType: "image/png" });
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ photoUrl: "https://photos.example.com/photo-1" });
    expect((await request(app).get("/api/auth/me").set(auth)).body.photoUrl).toBe(
      first.body.photoUrl,
    );

    await request(app)
      .put("/api/users/me/photo")
      .set(auth)
      .attach("photo", PNG, { filename: "new.png", contentType: "image/png" });
    expect(photos.deleted).toEqual(["photo-1"]);
  });

  it("refuses a renamed text file and a missing photo", async () => {
    const { app, auth, photos } = await signedIn();

    const fake = await request(app)
      .put("/api/users/me/photo")
      .set(auth)
      .attach("photo", Buffer.from("not a photo"), {
        filename: "me.png",
        contentType: "image/png",
      });
    expect(fake.status).toBe(400);
    expect(fake.body.error.code).toBe("invalid_photo");

    const missing = await request(app).put("/api/users/me/photo").set(auth).field("other", "x");
    expect(missing.status).toBe(400);
    expect(missing.body.error.issues).toEqual([{ path: "photo", message: "Choose a photo." }]);
    expect(photos.saved.size).toBe(0);
  });

  it("refuses a photo over 2 MB before it reaches storage", async () => {
    const { app, auth } = await signedIn();
    const huge = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);

    const res = await request(app)
      .put("/api/users/me/photo")
      .set(auth)
      .attach("photo", huge, { filename: "big.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expect(res.body.error.issues[0]).toEqual({
      path: "photo",
      message: "The photo must be 2 MB or smaller.",
    });
  });

  it("removes the photo, and needs a signed-in user", async () => {
    const { app, auth } = await signedIn();
    await request(app)
      .put("/api/users/me/photo")
      .set(auth)
      .attach("photo", PNG, { filename: "me.png", contentType: "image/png" });

    const removed = await request(app).delete("/api/users/me/photo").set(auth);

    expect(removed.body).toEqual({ photoUrl: null });
    expect((await request(app).get("/api/auth/me").set(auth)).body.photoUrl).toBeNull();
    expect((await request(app).delete("/api/users/me/photo")).status).toBe(401);
  });
});
