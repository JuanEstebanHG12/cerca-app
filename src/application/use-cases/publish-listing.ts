import { PublishListingError, PublishListingFailureReason } from '../../domain/errors/listing-errors';
import { Listing } from '../../domain/models/listing';
import { ListingGateway } from '../ports/listing-gateway';

export type PublishListingResult = { ok: true; listing: Listing } | { ok: false; reason: PublishListingFailureReason };

export class PublishListingUseCase {
  constructor(private readonly listingGateway: ListingGateway) {}

  async execute(id: string, accessToken: string): Promise<PublishListingResult> {
    try {
      const listing = await this.listingGateway.publish(id, accessToken);
      return { ok: true, listing };
    } catch (error) {
      if (error instanceof PublishListingError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
