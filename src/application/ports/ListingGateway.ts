import { Listing, ListingDetail, ListingId, Category, Pricing } from '../../domain/listing';
import { Coords } from '../../domain/models/Location';

export interface SearchListingsParams {
  query?: string;
  categoryId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  cursor?: string;
  limit?: number;
}

export interface PaginatedListings {
  items: Listing[];
  nextCursor: string | null;
}

export interface CreateListingData {
  title: string;
  description: string;
  categoryId: string;
  pricing: Pricing;
  location: Coords;
  cityName: string;
  serviceRadiusKm: number;
  photos: string[];
}

export interface ListingGateway {
  getCategories(): Promise<Category[]>;
  searchListings(params: SearchListingsParams): Promise<PaginatedListings>;
  getListingDetail(id: ListingId): Promise<ListingDetail>;
  getMyListings(): Promise<Listing[]>;
  createListing(data: CreateListingData): Promise<ListingDetail>;
  updateListing(id: ListingId, data: Partial<CreateListingData>): Promise<ListingDetail>;
  publishListing(id: ListingId): Promise<ListingDetail>;
  pauseListing(id: ListingId): Promise<ListingDetail>;
  uploadPhoto(id: ListingId, uri: string): Promise<{ uploadUrl: string; key: string }>;
  toggleFavorite(id: ListingId, isFavorite: boolean): Promise<boolean>;
  reportListing(id: ListingId, reason: string): Promise<void>;
  moderateListing(id: ListingId, action: 'under_review' | 'removed', reason?: string): Promise<void>;
}
