import { GeoPointDto, PricingDto } from './common';

export type ListingModerationAction = 'under_review' | 'removed';

export interface CreateListingApiRequestDto {
  categoryId: string;
  title: string;
  description: string;
  pricing: PricingDto;
  location: GeoPointDto;
}

export interface UpdateListingApiRequestDto {
  title?: string;
  description?: string;
  pricing?: PricingDto;
}

export interface SearchListingsApiQueryDto {
  query?: string;
  categoryId?: string;
  lat?: number;
  lng?: number;
  cityId?: string;
  radiusKm?: number;
  cursor?: string;
  limit?: number;
}

export interface ModerateListingApiRequestDto {
  action: ListingModerationAction;
  reason: string;
}
