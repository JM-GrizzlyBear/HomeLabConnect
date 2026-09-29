import { describe, expect, it } from "vitest";
import { JwtTokenService } from "../../../src/infrastructure/auth/jwtTokenService.js";

const secret = "a-test-secret-that-is-at-least-32-chars";
const claims = { userId: "b8f1c7a2-0000-4000-8000-000000000001", sessionId: "s-1" };
const inOneHour = () => new Date(Date.now() + 60 * 60_000);

describe("JwtTokenService", () => {
  it("round-trips the claims", () => {
    const service = new JwtTokenService(secret);
    expect(service.verify(service.issue(claims, inOneHour()))).toEqual(claims);
  });

  it("rejects a token signed with another secret", () => {
    const token = new JwtTokenService("another-secret-that-is-at-least-32-chars").issue(
      claims,
      inOneHour(),
    );
    expect(new JwtTokenService(secret).verify(token)).toBeNull();
  });

  it("rejects an expired token", () => {
    const service = new JwtTokenService(secret);
    expect(service.verify(service.issue(claims, new Date(Date.now() - 1000)))).toBeNull();
  });

  it("rejects garbage", () => {
    expect(new JwtTokenService(secret).verify("not.a.jwt")).toBeNull();
  });
});
