// Same shape as SignInError/SignUpError: a machine-readable reason the screen maps to a
// message, not a raw server string (Cerca.md: "los mensajes de error [...] son claves, no
// texto").
export type CreateListingFailureReason = 'forbidden' | 'validation_error' | 'network_error' | 'unexpected_error';

export class CreateListingError extends Error {
  constructor(readonly reason: CreateListingFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'CreateListingError';
  }
}

// Publishing is a separate call from creating (POST /listings/:id/publish) — every listing is
// born a draft, so this can fail on its own even after create() already succeeded.
export type PublishListingFailureReason = 'forbidden' | 'not_found' | 'network_error' | 'unexpected_error';

export class PublishListingError extends Error {
  constructor(readonly reason: PublishListingFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'PublishListingError';
  }
}

// GET /listings/:id is public — no 'forbidden' possible, only 'not_found' for a bad or removed
// id (and, in principle, a moderated listing the caller shouldn't see, but the backend doesn't
// distinguish that from 'not_found' at this endpoint).
export type GetListingFailureReason = 'not_found' | 'network_error' | 'unexpected_error';

export class GetListingError extends Error {
  constructor(readonly reason: GetListingFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'GetListingError';
  }
}

// The four reasons mirror @cerca/contract's EditListingReason exactly (canEditListing /
// canChangePrice in cerca-api) — the server's `reason` field on a 403 LISTING_EDIT_FORBIDDEN
// lands here unchanged, not collapsed into one generic 'forbidden'. That's what lets the edit
// screen say "ya tiene una reserva aceptada" instead of "no tienes permiso", the same
// `t('review.blocked.${reason}')` idea Cerca.md describes for canReviewBooking.
export type UpdateListingFailureReason =
  | 'no_capacity'
  | 'not_owner'
  | 'removed_by_moderation'
  | 'has_pending_bookings'
  | 'validation_error'
  | 'not_found'
  | 'network_error'
  | 'unexpected_error';

export class UpdateListingError extends Error {
  constructor(readonly reason: UpdateListingFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'UpdateListingError';
  }
}
