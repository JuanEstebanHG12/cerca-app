import { ListingGateway } from '../../application/ports/listing-gateway';
import {
  CreateListingError,
  GetListingError,
  PublishListingError,
  UpdateListingError,
  UpdateListingFailureReason,
} from '../../domain/errors/listing-errors';
import { CreateListingInput } from '../../domain/models/create-listing';
import { Listing, listingSchema, ListingSearchPage, listingSearchPageSchema } from '../../domain/models/listing';
import { SearchFilters } from '../../domain/models/search-filters';
import { UpdateListingInput } from '../../domain/models/update-listing';
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

  async getById(id: string): Promise<Listing> {
    try {
      const raw = await httpClient.get<unknown>(`/listings/${id}`);
      return listingSchema.parse(raw);
    } catch (error) {
      throw toGetListingError(error);
    }
  }

  async update(id: string, input: UpdateListingInput, accessToken: string): Promise<Listing> {
    try {
      const raw = await httpClient.patch<unknown>(`/listings/${id}`, input, accessToken);
      return listingSchema.parse(raw);
    } catch (error) {
      throw toUpdateListingError(error);
    }
  }
}

function toCreateListingError(error: unknown): CreateListingError {
  if (error instanceof ApiError) {
    // The screen only ever shows the generic copy mapped to `reason` (Cerca.md: server details
    // aren't user-facing text) — but that means a 422's actual field-level cause is otherwise
    // invisible during development. __DEV__ only, so this never ships to a release build.
    if (__DEV__ && (error.status === 400 || error.status === 422)) {
      console.warn('[create-listing] server rejected the payload:', error.message);
    }
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

function toGetListingError(error: unknown): GetListingError {
  if (error instanceof ApiError) {
    if (error.status === 404) return new GetListingError('not_found', error.message);
    return new GetListingError('unexpected_error', error.message);
  }
  if (error instanceof NetworkError) return new GetListingError('network_error', error.message);
  return new GetListingError('unexpected_error', error instanceof Error ? error.message : undefined);
}

const EDIT_FORBIDDEN_REASONS: readonly UpdateListingFailureReason[] = [
  'no_capacity',
  'not_owner',
  'removed_by_moderation',
  'has_pending_bookings',
];

function toUpdateListingError(error: unknown): UpdateListingError {
  if (error instanceof ApiError) {
    if (__DEV__ && (error.status === 400 || error.status === 422)) {
      console.warn('[update-listing] server rejected the payload:', error.message);
    }
    // The 403 IS the reason (Cerca.md: "El error que van a cometer" is treating this like a
    // plain boolean) — pass @cerca/contract's EditListingReason straight through instead of
    // collapsing every 403 into one generic 'forbidden', the way create/publish still do.
    if (error.status === 403 && isEditForbiddenReason(error.reason)) {
      return new UpdateListingError(error.reason, error.message);
    }
    // An unrecognized reason on a 403 is treated as unexpected, not silently mapped to one of
    // the known ones — a wrong specific message ("no eres el dueño") would be worse than a
    // generic one when the real cause is something this app doesn't know about yet.
    if (error.status === 403) return new UpdateListingError('unexpected_error', error.message);
    if (error.status === 404) return new UpdateListingError('not_found', error.message);
    if (error.status === 422 || error.status === 400) return new UpdateListingError('validation_error', error.message);
    return new UpdateListingError('unexpected_error', error.message);
  }
  if (error instanceof NetworkError) return new UpdateListingError('network_error', error.message);
  return new UpdateListingError('unexpected_error', error instanceof Error ? error.message : undefined);
}

function isEditForbiddenReason(reason: string | undefined): reason is UpdateListingFailureReason {
  return reason !== undefined && (EDIT_FORBIDDEN_REASONS as readonly string[]).includes(reason);
}
