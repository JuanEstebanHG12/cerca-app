import { Coords } from '../../domain/models/coords';

// Port over expo-location: the application only knows it can ask for the device's current
// coordinates, or get a LocationError back with a reason. Permission prompting, accuracy
// settings, and the expo-location API surface all live in the infrastructure implementation.
export interface LocationProvider {
  getCurrentPosition(): Promise<Coords>;
}
