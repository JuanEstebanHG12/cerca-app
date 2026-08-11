// The server answered, but with an error status. Shape follows the backend's RFC 9457
// problem+json body (see apps/api DomainExceptionFilter in cerca-api): { code, detail, ... }.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// fetch() itself rejected: no connectivity, DNS failure, server not running. Distinct from
// ApiError because there's no status code or body to read here.
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Could not reach the server.');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}
