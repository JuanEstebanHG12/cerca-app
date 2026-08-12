import { z } from 'zod';

export const coordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Coords = z.infer<typeof coordsSchema>;

// Rounds to ~1 km of precision. Without this, two GPS reads a metre apart produce two
// different React Query cache keys, so panning slightly would look like a brand new search
// (Cerca.md: "una clave ingenua genera una entrada nueva por cada píxel que se mueve el mapa").
export function snapToGrid(coords: Coords): Coords {
  return {
    lat: Math.round(coords.lat * 100) / 100,
    lng: Math.round(coords.lng * 100) / 100,
  };
}
