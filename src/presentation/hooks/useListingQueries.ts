import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiListingGateway } from '../../infrastructure/api/ApiListingGateway';
import { SearchListingsParams } from '../../application/ports/ListingGateway';
import { ListingId, ListingDetail } from '../../domain/listing';
import { snapToGrid, Coords } from '../../domain/models/Location';

const gateway = new ApiListingGateway();

export const listingKeys = {
  all: ['listings'] as const,
  categories: () => [...listingKeys.all, 'categories'] as const,
  searches: () => [...listingKeys.all, 'search'] as const,
  search: (params: SearchListingsParams) => {
    const gridLocation =
      params.lat !== undefined && params.lng !== undefined
        ? snapToGrid({ lat: params.lat, lng: params.lng })
        : undefined;
    return [...listingKeys.searches(), { ...params, location: gridLocation }] as const;
  },
  details: () => [...listingKeys.all, 'detail'] as const,
  detail: (id: ListingId) => [...listingKeys.details(), id] as const,
  mine: () => [...listingKeys.all, 'mine'] as const,
};

export function useCategoriesQuery() {
  return useQuery({
    queryKey: listingKeys.categories(),
    queryFn: () => gateway.getCategories(),
  });
}

export function useSearchListingsQuery(params: SearchListingsParams) {
  return useQuery({
    queryKey: listingKeys.search(params),
    queryFn: () => gateway.searchListings(params),
  });
}

export function useListingDetailQuery(id: ListingId) {
  return useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: () => gateway.getListingDetail(id),
    enabled: Boolean(id),
  });
}

export function useMyListingsQuery() {
  return useQuery({
    queryKey: listingKeys.mine(),
    queryFn: () => gateway.getMyListings(),
  });
}

export function useFavoriteMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, next }: { id: ListingId; next: boolean }) => gateway.toggleFavorite(id, next),
    onMutate: async ({ id, next }) => {
      await qc.cancelQueries({ queryKey: listingKeys.detail(id) });
      const prev = qc.getQueryData<ListingDetail>(listingKeys.detail(id));
      if (prev) {
        qc.setQueryData(listingKeys.detail(id), { ...prev, isFavorite: next });
      }
      return { prev };
    },
    onError: (_e, { id }, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(listingKeys.detail(id), ctx.prev);
      }
    },
    onSettled: (_d, _e, { id }) => {
      qc.invalidateQueries({ queryKey: listingKeys.detail(id) });
      qc.invalidateQueries({ queryKey: listingKeys.searches() });
    },
  });
}
