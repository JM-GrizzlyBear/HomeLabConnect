import type { DomainErrorKind } from "../../../domain/errors/domainError.js";
import { DomainError } from "../../../domain/errors/domainError.js";
import type { HttpResponse } from "../httpTypes.js";
import { InvalidRequest, type RequestIssue } from "../requestValidation.js";

export interface ErrorBody {
  error: { code: string; message: string; issues?: RequestIssue[] };
}

const statusByKind: Record<DomainErrorKind, number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
};

export function presentError(error: unknown): HttpResponse<ErrorBody> {
  if (error instanceof InvalidRequest) {
    return {
      status: 400,
      body: { error: { code: "invalid_request", message: error.message, issues: error.issues } },
    };
  }
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
