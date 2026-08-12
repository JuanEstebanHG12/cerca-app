import { snapToGrid } from '../../domain/models/coords';
import { SearchFilters } from '../../domain/models/search-filters';

// Hierarchical keys (Cerca.md's listingKeys shape): invalidating listingKeys.all() drops every
// listing query at once; invalidating listingKeys.searches() drops search results without
// touching a cached detail. `search()` snaps coords to a ~1km grid before they enter the key —
// that's what makes "move the map a little" reuse the cached page instead of refetching.
export const listingKeys = {
  all: () => ['listings'] as const,
  searches: () => [...listingKeys.all(), 'search'] as const,
  search: (filters: SearchFilters) =>
    [...listingKeys.searches(), { ...filters, coords: snapToGrid(filters.coords) }] as const,
  categories: () => ['categories'] as const,
};
