import { useQuery } from '@tanstack/react-query';
import { ListListingReviewsUseCase } from '../../application/use-cases/list-listing-reviews';
import { ReviewApiGateway } from '../../infrastructure/api/review-api-gateway';

const listListingReviews = new ListListingReviewsUseCase(new ReviewApiGateway());

// There's no GET /reviews/:id (see review-gateway.ts), so finding *one* review means fetching
// the listing's whole review page and searching it for the matching booking — only reasonable
// because a listing's review count is small in practice (this fetches at most 50, the max page
// size). `enabled` is passed in explicitly: this should only run when the caller already knows
// a review exists (canReviewBooking said 'already_reviewed') — no point searching otherwise.
export function useReviewForBooking(listingId: string, bookingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['reviews', 'forListing', listingId, 'forBooking', bookingId],
    queryFn: async () => {
      const page = await listListingReviews.execute(listingId);
      return page.items.find((review) => review.bookingId === bookingId) ?? null;
    },
    enabled,
  });
}
