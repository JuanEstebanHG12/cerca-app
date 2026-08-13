// Session only — verified against cerca-api's report-create.controller.ts, no
// @RequirePermission on POST /listings/:id/report. 'not_found' is the listing, not the report.
export type CreateReportFailureReason = 'not_found' | 'validation_error' | 'network_error' | 'unexpected_error';

export class CreateReportError extends Error {
  constructor(readonly reason: CreateReportFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'CreateReportError';
  }
}

// GET /reports requires 'report:resolve' (moderator/admin only) — confirmed by reading
// report-queue.controller.ts, not assumed from Cerca.md's endpoint table.
export type ListReportsFailureReason = 'no_capacity' | 'network_error' | 'unexpected_error';

export class ListReportsError extends Error {
  constructor(readonly reason: ListReportsFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'ListReportsError';
  }
}

// 'already_resolved' mirrors the backend's 409 REPORT_ALREADY_RESOLVED (resolve-report.use-case.ts)
// — a second moderator resolving the same report a moment later isn't a bug, it's a real race the
// queue has to explain instead of showing a generic error.
export type ResolveReportFailureReason =
  | 'no_capacity'
  | 'not_found'
  | 'already_resolved'
  | 'validation_error'
  | 'network_error'
  | 'unexpected_error';

export class ResolveReportError extends Error {
  constructor(readonly reason: ResolveReportFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'ResolveReportError';
  }
}
