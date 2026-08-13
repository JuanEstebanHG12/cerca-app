import { ReviewPage } from '../../domain/models/review';
import { ReviewGateway } from '../ports/review-gateway';

export class ListListingReviewsUseCase {
  constructor(private readonly reviewGateway: ReviewGateway) {}

  execute(listingId: string): Promise<ReviewPage> {
    return this.reviewGateway.listByListing(listingId);
  }
}
