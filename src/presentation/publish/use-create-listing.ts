import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateListingUseCase } from '../../application/use-cases/create-listing';
import { PublishListingUseCase } from '../../application/use-cases/publish-listing';
import { Listing } from '../../domain/models/listing';
import { ListingApiGateway } from '../../infrastructure/api/listing-api-gateway';
import { useAuth } from '../auth/auth-context';
import { listingKeys } from '../listings/listing-keys';
import { PublishFormValues } from './publish-form-schema';
import { toCreateListingInput } from './to-create-listing-input';

const listingGateway = new ListingApiGateway();
const createListing = new CreateListingUseCase(listingGateway);
const publishListing = new PublishListingUseCase(listingGateway);

export type PublishOutcome =
  | { ok: true; listing: Listing }
  // `stage` matters for the message: a failure at 'publish' still means the listing exists
  // (POST /listings already succeeded, as a draft) — a failure at 'create' means nothing was
  // saved at all. Same reason strings both stages can produce (CreateListingFailureReason /
  // PublishListingFailureReason overlap almost entirely) collapsed to `string` here since the
  // UI only needs a handful of them mapped to copy anyway.
  | { ok: false; stage: 'create' | 'publish'; reason: string };

// One mutation for the whole "create then publish" sequence — the wizard's submit button has
// exactly one action, "Publicar", even though it's two API calls underneath.
export function useCreateListing() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: PublishFormValues): Promise<PublishOutcome> => {
      if (!accessToken) {
        // Can't happen through the UI (the wizard only mounts while signed in), but the type
        // is `string | null` and this keeps that honest instead of a non-null assertion.
        return { ok: false, stage: 'create', reason: 'unexpected_error' };
      }

      const input = toCreateListingInput(values);
      const createResult = await createListing.execute(input, accessToken);
      if (!createResult.ok) {
        return { ok: false, stage: 'create', reason: createResult.reason };
      }

      const publishResult = await publishListing.execute(createResult.listing.id, accessToken);
      if (!publishResult.ok) {
        return { ok: false, stage: 'publish', reason: publishResult.reason };
      }

      return { ok: true, listing: publishResult.listing };
    },
    onSuccess: (outcome) => {
      if (outcome.ok) {
        // The new listing is now findable from Home — same "qué otras vistas muestran este
        // dato" reasoning Cerca.md gives for favorites applies to a freshly published listing.
        queryClient.invalidateQueries({ queryKey: listingKeys.searches() });
      }
    },
  });
}
