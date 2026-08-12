// A machine-readable reason, same idea as SignInError: the screen needs to know *why* it has
// no coordinates to pick between "ask again", "explain and offer a retry", or a city picker
// (US-08, useSearchOrigin) — not just render a blank list.
export type LocationFailureReason = 'permission_denied' | 'position_unavailable' | 'unexpected_error';

export class LocationError extends Error {
  constructor(
    readonly reason: LocationFailureReason,
    message?: string,
    // Only meaningful for 'permission_denied': the OS won't re-show its own permission dialog
    // once the user has denied it twice (or once with "don't ask again" on Android) — calling
    // requestForegroundPermissionsAsync again just resolves 'denied' without prompting.
    // 'Reintentar' has to become "open Settings" at that point, or it's a dead-end button that
    // looks like it does something.
    readonly canAskAgain: boolean = true,
  ) {
    super(message ?? reason);
    this.name = 'LocationError';
  }
}
