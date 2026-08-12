import { CreateListingInput } from '../../domain/models/create-listing';
import { Listing, ListingSearchPage } from '../../domain/models/listing';
import { SearchFilters } from '../../domain/models/search-filters';

// Port: the application knows it can search listings and get a page back. It has no idea this
// is a cursor-paginated GET with query params, or that the response is validated with zod —
// that lives behind ListingApiGateway in src/infrastructure/api.
export interface ListingGateway {
  search(filters: SearchFilters, cursor: string | null): Promise<ListingSearchPage>;
  // Every new listing is born a draft (the backend hardcodes it); `create` and `publish` are
  // deliberately two calls, not one, because the API models them as two calls — going live is
  // its own transition, not a side effect of creation.
  create(input: CreateListingInput, accessToken: string): Promise<Listing>;
  publish(id: string, accessToken: string): Promise<Listing>;
}
