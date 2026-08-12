import type { Coords } from './coords';

export interface City {
  readonly id: string;
  readonly name: string;
  readonly coords: Coords;
}

// Mirrors CITY_COORDINATES in apps/api/src/modules/listing/infrastructure/city-coordinates.ts
// (cerca-api) — GET /listings only recognizes these six `cityId`s when the request has no
// lat/lng (US-08). Adds a display `name` for the picker; the server never sees it, only `id`.
export const CITIES: readonly City[] = [
  { id: 'bogota', name: 'Bogotá', coords: { lat: 4.711, lng: -74.0721 } },
  { id: 'medellin', name: 'Medellín', coords: { lat: 6.2442, lng: -75.5812 } },
  { id: 'cali', name: 'Cali', coords: { lat: 3.4516, lng: -76.532 } },
  { id: 'barranquilla', name: 'Barranquilla', coords: { lat: 10.9685, lng: -74.7813 } },
  { id: 'cartagena', name: 'Cartagena', coords: { lat: 10.391, lng: -75.4794 } },
  { id: 'bucaramanga', name: 'Bucaramanga', coords: { lat: 7.1193, lng: -73.1227 } },
];

export function findCity(cityId: string): City | undefined {
  return CITIES.find((city) => city.id === cityId);
}
