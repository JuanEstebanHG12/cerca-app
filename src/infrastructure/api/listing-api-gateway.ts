import { ListingGateway } from '../../application/ports/listing-gateway';
import { ListingSearchPage, listingSearchPageSchema } from '../../domain/models/listing';
import { SearchFilters } from '../../domain/models/search-filters';
import { httpClient } from './http-client';

// Builds the query string GET /listings expects and validates the page it gets back with
// `parse`, never `as` (Cerca.md: "el límite con la red se valida, no se promete") — if the
// backend renames a field, this throws here with a clear message, not three screens later.
export class ListingApiGateway implements ListingGateway {
  async search(filters: SearchFilters, cursor: string | null): Promise<ListingSearchPage> {
    const params = new URLSearchParams({
      lat: String(filters.coords.lat),
      lng: String(filters.coords.lng),
      radiusKm: String(filters.radiusKm),
    });
    if (filters.query) params.set('query', filters.query);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (cursor) params.set('cursor', cursor);

    const raw = await httpClient.get<unknown>(`/listings?${params.toString()}`);
    return listingSearchPageSchema.parse(raw);
  }
}
