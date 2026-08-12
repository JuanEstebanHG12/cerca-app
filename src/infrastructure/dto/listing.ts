import { z } from 'zod';
import { geoPointSchema, pricingSchema } from './common';

export const createListingRequestSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().min(1).max(4000),
  pricing: pricingSchema,
  location: geoPointSchema,
});
export type CreateListingApiRequestDto = z.infer<typeof createListingRequestSchema>;

export const updateListingRequestSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(1).max(4000).optional(),
  pricing: pricingSchema.optional(),
});
export type UpdateListingApiRequestDto = z.infer<typeof updateListingRequestSchema>;

export const searchListingsQuerySchema = z.object({
  query: z.string().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  cityId: z.string().max(64).optional(),
  radiusKm: z.number().min(0.1).max(200).default(10).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20).optional(),
});
export type SearchListingsApiQueryDto = z.infer<typeof searchListingsQuerySchema>;

export const moderateListingRequestSchema = z.object({
  action: z.enum(['under_review', 'removed']),
  reason: z.string().min(1).max(500),
});
export type ModerateListingApiRequestDto = z.infer<typeof moderateListingRequestSchema>;
