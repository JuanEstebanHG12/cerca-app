// 'own_listing' and 'not_bookable' mirror @cerca/contract's RequestBookingReason exactly
// (canRequestBooking in cerca-api). 'no_capacity' mirrors the same literal the capability guard
// uses elsewhere (listing-errors.ts) — unreachable in practice today (every platform role has
// `booking:request`), kept for the same reason UpdateListingError keeps it: an unrecognized 403
// reason should never masquerade as a recognized one.
//
// 'in_progress' is specific to this endpoint: POST /bookings requires an Idempotency-Key header
// (cerca-api's IdempotencyInterceptor), and a concurrent request with the same key + body while
// the first is still in flight gets 409 IDEMPOTENCY_IN_PROGRESS — the exact "pulsé dos veces"
// case the acceptance criterion names. It is not a failure to explain to the user as an error;
// see use-request-booking.ts for how the UI treats it.
export type RequestBookingFailureReason =
  | 'own_listing'
  | 'not_bookable'
  | 'no_capacity'
  | 'in_progress'
  | 'validation_error'
  | 'not_found'
  | 'network_error'
  | 'unexpected_error';

export class RequestBookingError extends Error {
  constructor(readonly reason: RequestBookingFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'RequestBookingError';
  }
}

// GET /bookings/:id 404s both for a booking that truly doesn't exist and for one that exists
// but the caller isn't a participant of (cerca-api's GetBookingUseCase: "404, not 403, to avoid
// leaking that the booking exists at all") — the client can't and shouldn't try to tell those
// apart, so there's only one reason for both.
export type GetBookingFailureReason = 'not_found' | 'network_error' | 'unexpected_error';

export class GetBookingError extends Error {
  constructor(readonly reason: GetBookingFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'GetBookingError';
  }
}

// Shared by accept/decline/complete — the three "provider manages a booking" actions. All three
// fail for the exact same two reasons in cerca-api (see booking-guards.ts's loadOwnedListing,
// and each use-case's own status check): you don't own the listing ('not_owner'), or the
// booking isn't in the right state for this action ('invalid_state' — e.g. trying to accept a
// booking that's already accepted). One error type for all three instead of three near-identical
// copies.
export type ManageBookingFailureReason =
  | 'not_owner'
  | 'invalid_state'
  | 'not_found'
  | 'network_error'
  | 'unexpected_error';

export class ManageBookingError extends Error {
  constructor(readonly reason: ManageBookingFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'ManageBookingError';
  }
}
