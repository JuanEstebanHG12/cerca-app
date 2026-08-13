import { useQuery } from '@tanstack/react-query';
import { GetListingUseCase } from '../../application/use-cases/get-listing';
import { ListingApiGateway } from '../../infrastructure/api/listing-api-gateway';
import { listingKeys } from './listing-keys';

const getListing = new GetListingUseCase(new ListingApiGateway());

// `queryFn` throws instead of returning the `{ ok, reason }` result directly — React Query's
// error state (not a discriminated union in `data`) is what the detail screen's loading/error
// branches already expect, matching every other query in this app (useSearchListings included).
// The thrown error's `message` carries the typed reason (see GetListingFailureReason) so the
// screen — and `retry` below — can tell 'not_found' apart from a transient network failure.
export function useListing(id: string) {
  return useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: async () => {
      const result = await getListing.execute(id);
      if (!result.ok) throw new Error(result.reason);
      return result.listing;
    },
    // `enabled` lets a caller pass '' before it actually knows the id yet (e.g. the booking
    // detail screen, which needs a listing's title but only learns the listingId once its own
    // booking has loaded) — this hook still has to be *called* unconditionally either way, or
    // React's hooks-order check breaks; `enabled` is what makes calling it early harmless.
    enabled: id !== '',
    // Overrides the global `shouldRetry` (query-client.ts), which only knows about ApiError —
    // by the time an error reaches here it's already the plain Error above. Retrying a bad id
    // three times is as pointless as retrying a denied permission; a network blip is worth it.
    retry: (failureCount, error) => error.message !== 'not_found' && failureCount < 2,
  });
}
