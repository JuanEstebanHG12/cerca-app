import type { LocationGateway, LocationRequestResult } from '../ports/location-gateway';

// Thin on purpose: today it's a thin pass-through to the gateway, but it's the seam where
// this flow would gain logic later (e.g. remembering the last fix) without presentation code
// ever importing expo-location directly.
export class RequestLocationUseCase {
  constructor(private readonly location: LocationGateway) {}

  execute(): Promise<LocationRequestResult> {
    return this.location.requestCurrentCoords();
  }
}
