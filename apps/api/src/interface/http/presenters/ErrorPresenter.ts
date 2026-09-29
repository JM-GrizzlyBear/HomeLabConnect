import type { DomainErrorKind } from "../../../domain/errors/DomainError.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { HttpResponse } from "../HttpTypes.js";

export interface ErrorBody {
  error: { code: string; message: string };
}

const statusByKind: Record<DomainErrorKind, number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
};

export function presentError(error: unknown): HttpResponse<ErrorBody> {
  if (error instanceof DomainError) {
    return {
      status: statusByKind[error.kind],
      body: { error: { code: error.code, message: error.message } },
    };
  }
  return {
    status: 500,
    body: { error: { code: "internal_error", message: "Something went wrong." } },
  };
}

export function presentNotFound(): HttpResponse<ErrorBody> {
  return {
    status: 404,
    body: { error: { code: "route_not_found", message: "Route not found." } },
  };
}
