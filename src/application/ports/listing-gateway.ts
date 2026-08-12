import { ListingSearchPage } from '../../domain/models/listing';
import { SearchFilters } from '../../domain/models/search-filters';

// Port: the application knows it can search listings and get a page back. It has no idea this
// is a cursor-paginated GET with query params, or that the response is validated with zod —
// that lives behind ListingApiGateway in src/infrastructure/api.
export interface ListingGateway {
  search(filters: SearchFilters, cursor: string | null): Promise<ListingSearchPage>;
}
