// The server answered, but with an error status. Shape follows the backend's RFC 9457
// problem+json body (see apps/api DomainExceptionFilter in cerca-api): { code, detail, reason?, ... }.
// `reason` is the machine-readable one (Cerca.md: 403/409 domain errors carry a `reason` that
// matches a policy's own reason type, e.g. @cerca/contract's EditListingReason) — gateways map
// it to a typed domain error instead of collapsing every 403 to one generic message.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly reason?: string,
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
