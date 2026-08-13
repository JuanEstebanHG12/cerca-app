import { z } from 'zod';
import { Actor, UserId, can } from './actor';
import { Money } from './money';
import { Coords } from './models/Location';

export type ListingId = string;
export type ReportId = string;

export type ListingStatus =
  | { kind: 'draft' }
  | { kind: 'published'; publishedAt: string }
  | { kind: 'paused' }
  | { kind: 'under_review'; reportId: ReportId }
  | { kind: 'removed'; removedBy: UserId; reason: string };

export type Pricing =
  | { model: 'fixed'; price: Money }
  | { model: 'hourly'; hourlyRate: Money; minimumHours: number }
  | { model: 'quote'; startingFrom?: Money };

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Listing {
  id: ListingId;
  ownerId: UserId;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  pricing: Pricing;
  status: ListingStatus;
  location: Coords;
  cityName: string;
  distanceKm?: number;
  coverImage: string;
  ratingAverage: number;
  ratingCount: number;
  isFavorite?: boolean;
}

export interface ListingDetail extends Listing {
  ownerName: string;
  ownerAvatar?: string;
  photos: string[];
  serviceRadiusKm: number;
  createdAt: string;
}

export const moneySchema = z.object({
  amountMinor: z.number().int(),
  currency: z.enum(['MXN', 'USD', 'EUR', 'JPY', 'GBP', 'KWD']),
});

export const pricingSchema = z.discriminatedUnion('model', [
  z.object({
    model: z.literal('fixed'),
    price: moneySchema,
  }),
  z.object({
    model: z.literal('hourly'),
    hourlyRate: moneySchema,
    minimumHours: z.number().min(1),
  }),
  z.object({
    model: z.literal('quote'),
    startingFrom: moneySchema.optional(),
  }),
]);

export const listingStatusSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('draft') }),
  z.object({ kind: z.literal('published'), publishedAt: z.string() }),
  z.object({ kind: z.literal('paused') }),
  z.object({ kind: z.literal('under_review'), reportId: z.string() }),
  z.object({ kind: z.literal('removed'), removedBy: z.string(), reason: z.string() }),
]);

export const coordsSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const listingSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  description: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  pricing: pricingSchema,
  status: listingStatusSchema,
  location: coordsSchema,
  cityName: z.string(),
  distanceKm: z.number().optional(),
  coverImage: z.string(),
  ratingAverage: z.number(),
  ratingCount: z.number(),
  isFavorite: z.boolean().optional(),
});

export const listingDetailSchema = listingSchema.extend({
  ownerName: z.string(),
  ownerAvatar: z.string().optional(),
  photos: z.array(z.string()),
  serviceRadiusKm: z.number(),
  createdAt: z.string(),
});

export function canEditListing(actor: Actor, listing: Listing | ListingDetail): boolean {
  const hasCapacity = can(actor, 'listing:update');
  const isOwner = listing.ownerId === actor.id || actor.platformRole === 'admin';
  return hasCapacity && isOwner;
}
