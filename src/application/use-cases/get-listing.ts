import { GetListingError, GetListingFailureReason } from '../../domain/errors/listing-errors';
import { Listing } from '../../domain/models/listing';
import { ListingGateway } from '../ports/listing-gateway';

export type GetListingResult = { ok: true; listing: Listing } | { ok: false; reason: GetListingFailureReason };

export class GetListingUseCase {
  constructor(private readonly listingGateway: ListingGateway) {}

  async execute(id: string): Promise<GetListingResult> {
    try {
      const listing = await this.listingGateway.getById(id);
      return { ok: true, listing };
    } catch (error) {
      if (error instanceof GetListingError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
