// Same 4 reasons as ReviewBlockedReason (review-eligibility.ts) — the server can send any of
// them too, since it re-checks the same rule. The server actually replies with two different
// HTTP status codes for these (409 for already_reviewed/not_completed, 403 for the other two —
// see write-review.use-case.ts in cerca-api), but the client doesn't need to care: it reads
// `reason` either way and shows the matching message.
export type WriteReviewFailureReason =
  | 'not_your_booking'
  | 'not_completed'
  | 'already_reviewed'
  | 'window_closed'
  | 'validation_error'
  | 'not_found'
  | 'network_error'
  | 'unexpected_error';

export class WriteReviewError extends Error {
  constructor(readonly reason: WriteReviewFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'WriteReviewError';
  }
}
