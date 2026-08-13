import { UpdateListingError, UpdateListingFailureReason } from '../../domain/errors/listing-errors';
import { Listing } from '../../domain/models/listing';
import { UpdateListingInput } from '../../domain/models/update-listing';
import { ListingGateway } from '../ports/listing-gateway';

export type UpdateListingResult = { ok: true; listing: Listing } | { ok: false; reason: UpdateListingFailureReason };

export class UpdateListingUseCase {
  constructor(private readonly listingGateway: ListingGateway) {}

  async execute(id: string, input: UpdateListingInput, accessToken: string): Promise<UpdateListingResult> {
    try {
      const listing = await this.listingGateway.update(id, input, accessToken);
      return { ok: true, listing };
    } catch (error) {
      if (error instanceof UpdateListingError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
