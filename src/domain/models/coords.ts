// Mirrors the backend's GeoPoint (packages/contract/src/listing/listing.schemas.ts in
// cerca-api): plain lat/lng, no altitude or accuracy — the app only ever needs "where" for
// search, never the extra sensor data expo-location also returns.
export interface Coords {
  readonly lat: number;
  readonly lng: number;
}
