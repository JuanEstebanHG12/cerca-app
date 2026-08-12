import { ListingGateway } from '../../application/ports/listing-gateway';
import { CreateListingError, PublishListingError } from '../../domain/errors/listing-errors';
import { CreateListingInput } from '../../domain/models/create-listing';
import { Listing, listingSchema, ListingSearchPage, listingSearchPageSchema } from '../../domain/models/listing';
import { SearchFilters } from '../../domain/models/search-filters';
import { ApiError, NetworkError } from './api-errors';
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

  async create(input: CreateListingInput, accessToken: string): Promise<Listing> {
    try {
      const raw = await httpClient.post<unknown>('/listings', input, accessToken);
      return listingSchema.parse(raw);
    } catch (error) {
      throw toCreateListingError(error);
    }
  }

  async publish(id: string, accessToken: string): Promise<Listing> {
    try {
      const raw = await httpClient.post<unknown>(`/listings/${id}/publish`, undefined, accessToken);
      return listingSchema.parse(raw);
    } catch (error) {
      throw toPublishListingError(error);
    }
  }
}

function toCreateListingError(error: unknown): CreateListingError {
  if (error instanceof ApiError) {
    if (error.status === 403) return new CreateListingError('forbidden', error.message);
    if (error.status === 422 || error.status === 400) return new CreateListingError('validation_error', error.message);
    return new CreateListingError('unexpected_error', error.message);
  }
  if (error instanceof NetworkError) return new CreateListingError('network_error', error.message);
  return new CreateListingError('unexpected_error', error instanceof Error ? error.message : undefined);
}

function toPublishListingError(error: unknown): PublishListingError {
  if (error instanceof ApiError) {
    if (error.status === 403) return new PublishListingError('forbidden', error.message);
    if (error.status === 404) return new PublishListingError('not_found', error.message);
    return new PublishListingError('unexpected_error', error.message);
  }
  if (error instanceof NetworkError) return new PublishListingError('network_error', error.message);
  return new PublishListingError('unexpected_error', error instanceof Error ? error.message : undefined);
}
