import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateListingUseCase } from '../../application/use-cases/update-listing';
import { ListingApiGateway } from '../../infrastructure/api/listing-api-gateway';
import { useAuth } from '../auth/auth-context';
import { EditListingFormValues } from './edit-listing-form-schema';
import { listingKeys } from './listing-keys';
import { toUpdateListingInput } from './to-update-listing-input';

const updateListing = new UpdateListingUseCase(new ListingApiGateway());

export function useUpdateListing(listingId: string) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      values,
      dirtyFields,
    }: {
      values: EditListingFormValues;
      dirtyFields: Partial<Record<keyof EditListingFormValues, boolean>>;
    }) => {
      if (!accessToken) {
        // Can't happen through the UI (the edit screen only mounts while signed in and owning
        // the listing) — same defensive shape as useCreateListing's equivalent guard.
        return { ok: false as const, reason: 'unexpected_error' as const };
      }
      const input = toUpdateListingInput(values, dirtyFields);
      return updateListing.execute(listingId, input, accessToken);
    },
    onSuccess: (result) => {
      if (result.ok) {
        // "Qué otras vistas muestran este dato" (Cerca.md) applies here too: the title/price
        // that just changed are also what a search card shows.
        queryClient.setQueryData(listingKeys.detail(listingId), result.listing);
        queryClient.invalidateQueries({ queryKey: listingKeys.searches() });
      }
    },
  });
}
