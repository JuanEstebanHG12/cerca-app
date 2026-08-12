import { z } from 'zod';
import { moneySchema } from './money';

// Mirrors GET /listings' actual wire shape: a plain status string, not the richer
// per-transition shape (publishedAt / reportId / removedBy+reason) — that detail only exists
// on GET /listings/:id, not on search results.
export const listingStatusSchema = z.enum(['draft', 'published', 'paused', 'under_review', 'removed']);
export type ListingStatus = z.infer<typeof listingStatusSchema>;

// The shape GET /listings returns per result: everything a card needs, plus distanceMeters,
// which only exists in the context of a geolocated search — it's not a property of the listing
// itself, so it doesn't belong on a generic Listing type outside this search context.
// `priceFrom` (not the full `pricing` model) and `ratingAvg`/`ratingCount` (not a combined
// `rating`) match the backend's ListingSearchItem contract exactly — search results don't
// carry the full listing.
export const listingSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  categoryId: z.string(),
  status: listingStatusSchema,
  priceFrom: moneySchema.nullable(),
  ratingAvg: z.number(),
  ratingCount: z.number().int().nonnegative(),
  distanceMeters: z.number().nonnegative(),
});
export type ListingSearchResult = z.infer<typeof listingSearchResultSchema>;

export const listingSearchPageSchema = z.object({
  items: z.array(listingSearchResultSchema),
  nextCursor: z.string().nullable(),
});
export type ListingSearchPage = z.infer<typeof listingSearchPageSchema>;
