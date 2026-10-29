import { testResultParamsSchema, uploadResultFieldsSchema } from "@homelabconnect/shared";
import type { UploadTestResult } from "../../../application/results/UploadTestResult.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";

/** A multipart form: the result "file" and an optional "comment". */
export class UploadTestResultController implements Controller {
  constructor(private readonly uploadTestResult: UploadTestResult) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id, procedureId } = parseRequest(testResultParamsSchema, request.params);
    const { comment } = parseRequest(uploadResultFieldsSchema, request.body ?? {});
    await this.uploadTestResult.execute({
      appointmentId: id,
      procedureId,
      file: request.file ? { data: request.file.data, filename: request.file.filename } : null,
      comment: comment ?? null,
      actorId: requireAuth(request).userId,
    });
    return { status: 204, body: undefined };
  }
}
