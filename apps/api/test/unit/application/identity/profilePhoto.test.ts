import { describe, expect, it } from "vitest";
import { RemoveProfilePhoto } from "../../../../src/application/identity/RemoveProfilePhoto.js";
import { SetProfilePhoto } from "../../../../src/application/identity/SetProfilePhoto.js";
import { InvalidPhoto } from "../../../../src/domain/media/mediaErrors.js";
import { FakePhotoStorage, InMemoryUserRepository } from "../../../support/fakes.js";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function setup() {
  const users = new InMemoryUserRepository();
  const photos = new FakePhotoStorage();
  const user = users.add({ email: "juan@example.com" });
  return {
    users,
    photos,
    user,
    setPhoto: new SetProfilePhoto(users, photos),
    removePhoto: new RemoveProfilePhoto(users, photos),
  };
}

describe("SetProfilePhoto", () => {
  it("stores the photo with its real type and links it to the user", async () => {
    const { users, photos, user, setPhoto } = setup();

    const output = await setPhoto.execute({ userId: user.id, data: PNG });

    expect(output.photoUrl).toBe("https://photos.example.com/photo-1");
    expect(photos.saved.get("photo-1")?.mimeType).toBe("image/png");
    expect(users.users.get(user.id)).toMatchObject({
      photoUrl: output.photoUrl,
      photoStorageKey: "photo-1",
    });
  });

  it("deletes the old photo when it's replaced", async () => {
    const { photos, user, setPhoto } = setup();
    await setPhoto.execute({ userId: user.id, data: PNG });

    await setPhoto.execute({ userId: user.id, data: PNG });

    expect(photos.deleted).toEqual(["photo-1"]);
    expect([...photos.saved.keys()]).toHaveLength(1);
  });

  it("refuses a file that isn't a JPG, PNG or WebP, and one over 2 MB", async () => {
    const { photos, user, setPhoto } = setup();
    const text = new TextEncoder().encode("not a photo");

    await expect(setPhoto.execute({ userId: user.id, data: text })).rejects.toThrow(InvalidPhoto);
    const huge = new Uint8Array(2 * 1024 * 1024 + 1);
    huge.set(PNG);
    await expect(setPhoto.execute({ userId: user.id, data: huge })).rejects.toThrow(
      "2 MB or smaller",
    );
    expect(photos.saved.size).toBe(0);
  });
});

describe("RemoveProfilePhoto", () => {
  it("clears the photo and deletes it from storage", async () => {
    const { users, photos, user, setPhoto, removePhoto } = setup();
    await setPhoto.execute({ userId: user.id, data: PNG });

    await expect(removePhoto.execute({ userId: user.id })).resolves.toEqual({ photoUrl: null });

    expect(users.users.get(user.id)?.photoUrl).toBeNull();
    expect(photos.deleted).toEqual(["photo-1"]);
  });
});
