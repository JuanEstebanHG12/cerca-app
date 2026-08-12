import * as Location from 'expo-location';
import { LocationProvider } from '../../application/ports/location-provider';
import { Coords } from '../../domain/models/coords';
import { LocationError } from '../../domain/errors/location-errors';

// The only place in the app that knows expo-location exists. Balanced accuracy is deliberate:
// this drives a "services near me" radius search, not turn-by-turn navigation, and Balanced
// resolves faster and cheaper on battery than High/Best.
export class ExpoLocationProvider implements LocationProvider {
  async getCurrentPosition(): Promise<Coords> {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new LocationError('permission_denied', 'Location permission was not granted.', canAskAgain);
    }

    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (cause) {
      throw new LocationError(
        'position_unavailable',
        cause instanceof Error ? cause.message : 'Could not resolve the current position.',
      );
    }
  }
}
