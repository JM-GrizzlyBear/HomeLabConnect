import { describe, expect, it } from "vitest";
import { detectPhotoType } from "../../../../src/domain/media/photo.js";

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

describe("detectPhotoType", () => {
  it("reads JPG, PNG and WebP from their first bytes", () => {
    expect(detectPhotoType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectPhotoType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe(
      "image/png",
    );
    expect(detectPhotoType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")))).toBe(
      "image/webp",
    );
  });

  it("refuses anything else, whatever its name says", () => {
    expect(detectPhotoType(bytes(...ascii("hello, not a photo")))).toBeNull();
    expect(detectPhotoType(bytes(...ascii("GIF89a")))).toBeNull();
    expect(detectPhotoType(bytes())).toBeNull();
  });
});
