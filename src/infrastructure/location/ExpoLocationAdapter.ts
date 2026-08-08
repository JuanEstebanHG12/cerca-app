import * as Location from 'expo-location';
import { LocationGateway } from '../../application/ports/LocationGateway';
import { Coords } from '../../domain/models/Location';


export class ExpoLocationAdapter implements LocationGateway {
  async getCurrentLocation(): Promise<Coords | null> {
    try {
      // 1. Pedir permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null; // Degradación elegante: el llamador usará una ciudad por defecto
      }

      // 2. Obtener posición actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch {
      return null;
    }
  }
}