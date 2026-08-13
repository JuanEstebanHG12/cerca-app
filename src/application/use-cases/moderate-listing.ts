import { ModerateListingError, ModerateListingFailureReason } from '../../domain/errors/listing-errors';
import { Listing } from '../../domain/models/listing';
import { ModerateListingInput } from '../../domain/models/moderate-listing';
import { ListingGateway } from '../ports/listing-gateway';

export type ModerateListingResult = { ok: true; listing: Listing } | { ok: false; reason: ModerateListingFailureReason };

export class ModerateListingUseCase {
  constructor(private readonly listingGateway: ListingGateway) {}

  async execute(id: string, input: ModerateListingInput, accessToken: string): Promise<ModerateListingResult> {
    try {
      const listing = await this.listingGateway.moderate(id, input, accessToken);
      return { ok: true, listing };
    } catch (error) {
      if (error instanceof ModerateListingError) return { ok: false, reason: error.reason };
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
