// A machine-readable reason, same idea as SignInError: the screen needs to know *why* it has
// no coordinates to pick between "ask again", "explain and offer a retry", or (US-08, not yet
// built) a city picker — not just render a blank list.
export type LocationFailureReason = 'permission_denied' | 'position_unavailable' | 'unexpected_error';

export class LocationError extends Error {
  constructor(readonly reason: LocationFailureReason, message?: string) {
    super(message ?? reason);
    this.name = 'LocationError';
  }
}
