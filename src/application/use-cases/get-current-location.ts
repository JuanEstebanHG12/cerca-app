import { Coords } from '../../domain/models/coords';
import { LocationError, LocationFailureReason } from '../../domain/errors/location-errors';
import { LocationProvider } from '../ports/location-provider';

// Result type instead of a thrown exception at the call site: a denied permission is an
// expected outcome here, not a bug, and the screen needs the reason to decide between
// "explain and offer retry" and (US-08) a city picker — same shape as SignInResult.
export type GetCurrentLocationResult =
  | { ok: true; coords: Coords }
  | { ok: false; reason: LocationFailureReason; canAskAgain: boolean };

export class GetCurrentLocationUseCase {
  constructor(private readonly locationProvider: LocationProvider) {}

  async execute(): Promise<GetCurrentLocationResult> {
    try {
      const coords = await this.locationProvider.getCurrentPosition();
      return { ok: true, coords };
    } catch (error) {
      if (error instanceof LocationError) {
        return { ok: false, reason: error.reason, canAskAgain: error.canAskAgain };
      }
      return { ok: false, reason: 'unexpected_error', canAskAgain: true };
    }
  }
}
