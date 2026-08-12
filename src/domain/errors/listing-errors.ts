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
