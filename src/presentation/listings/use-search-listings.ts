import { useInfiniteQuery } from '@tanstack/react-query';
import { SearchListingsUseCase } from '../../application/use-cases/search-listings';
import { ListingApiGateway } from '../../infrastructure/api/listing-api-gateway';
import { SearchFilters } from '../../domain/models/search-filters';
import { listingKeys } from './listing-keys';

// Stateless gateway, one instance for the app's lifetime — same reasoning as the module-level
// `httpClient` singleton it sits on top of.
const searchListings = new SearchListingsUseCase(new ListingApiGateway());

// `filters` is null until we have coordinates to search from; `enabled: false` in that case
// means React Query never calls queryFn, so the null case inside it is unreachable in practice.
export function useSearchListings(filters: SearchFilters | null) {
  return useInfiniteQuery({
    queryKey: filters ? listingKeys.search(filters) : listingKeys.searches(),
    queryFn: ({ pageParam }: { pageParam: string | null }) => searchListings.execute(filters!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: filters !== null,
  });
}
