/**
 * Framework-free request/response shapes. Controllers and presenters speak
 * these; the infrastructure layer translates them to and from Express.
 */
export interface HttpRequest<
  TBody = unknown,
  TParams extends Record<string, string> = Record<string, string>,
> {
  body: TBody;
  params: TParams;
  query: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
}

export interface HttpResponse<TBody = unknown> {
  status: number;
  body: TBody;
}

export interface Controller {
  handle(request: HttpRequest): Promise<HttpResponse>;
}
