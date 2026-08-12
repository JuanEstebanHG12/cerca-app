import { CreateListingInput } from '../../domain/models/create-listing';
import { CreateListingError, CreateListingFailureReason } from '../../domain/errors/listing-errors';
import { Listing } from '../../domain/models/listing';
import { ListingGateway } from '../ports/listing-gateway';

export type CreateListingResult = { ok: true; listing: Listing } | { ok: false; reason: CreateListingFailureReason };

export class CreateListingUseCase {
  constructor(private readonly listingGateway: ListingGateway) {}

  async execute(input: CreateListingInput, accessToken: string): Promise<CreateListingResult> {
    try {
      const listing = await this.listingGateway.create(input, accessToken);
      return { ok: true, listing };
    } catch (error) {
      if (error instanceof CreateListingError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
