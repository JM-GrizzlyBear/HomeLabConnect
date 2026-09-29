import { type HealthResponse, healthResponseSchema } from "@homelabconnect/shared";

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch("/api/health", { signal });
  // 503 still carries a health body, so parse it either way.
  return healthResponseSchema.parse(await res.json());
}
