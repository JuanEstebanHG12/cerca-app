import { Coords } from './coords';

// Everything GET /listings can be asked for. `coords` is required to search at all — there is
// no "search the whole world" mode, the product is inherently local.
export interface SearchFilters {
  coords: Coords;
  radiusKm: number;
  query?: string;
  categoryId?: string;
}

export const DEFAULT_RADIUS_KM = 5;
export const RADIUS_OPTIONS_KM = [1, 5, 10, 20] as const;
