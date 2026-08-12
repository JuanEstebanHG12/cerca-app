import type { Coords } from '../../domain/models/coords';

// A motive, not a boolean (Cerca.md's canReviewBooking rule applies here too): 'denied' and
// 'unavailable' need different copy — one is "you said no", the other is "GPS is off or has
// no fix" — and the screen decides that copy, not this port.
export type LocationRequestResult =
  | { status: 'granted'; coords: Coords }
  | { status: 'denied' }
  | { status: 'unavailable' };

// Port: the application only knows it can ask "where is the user, right now". It has no idea
// this means a permission dialog and a GPS fix — that lives behind the implementation in
// src/infrastructure/location, same Dependency Inversion as AuthGateway.
export interface LocationGateway {
  requestCurrentCoords(): Promise<LocationRequestResult>;
}
