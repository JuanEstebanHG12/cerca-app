import { ListingSearchPage } from '../../domain/models/listing';
import { SearchFilters } from '../../domain/models/search-filters';
import { ListingGateway } from '../ports/listing-gateway';

export class SearchListingsUseCase {
  constructor(private readonly listingGateway: ListingGateway) {}

  execute(filters: SearchFilters, cursor: string | null): Promise<ListingSearchPage> {
    return this.listingGateway.search(filters, cursor);
  }
}
