import * as Location from 'expo-location';
import type { LocationGateway, LocationRequestResult } from '../../application/ports/location-gateway';

// The one place allowed to know 'expo-location' exists. Foreground-only: a marketplace
// search only ever needs "where is the user right now", never a background trail.
export class ExpoLocationGateway implements LocationGateway {
  async requestCurrentCoords(): Promise<LocationRequestResult> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { status: 'denied' };
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        status: 'granted',
        coords: { lat: position.coords.latitude, lng: position.coords.longitude },
      };
    } catch {
      // Permission was granted but the fix itself failed — GPS/location services off, no
      // signal indoors, timeout. Same fallback as an explicit denial: never leave the screen
      // blank, let the caller fall back to the city picker.
      return { status: 'unavailable' };
    }
  }
}
