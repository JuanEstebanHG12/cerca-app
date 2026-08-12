import { z } from 'zod';
import { moneySchema } from './money';
import { pricingSchema } from './pricing';

// Mirrors the actual wire shape everywhere a listing's status appears — search results AND
// the full detail/create/publish response. Cerca.md's own example models `ListingStatus` as a
// richer per-kind union (`{ kind: 'published', publishedAt }`, `{ kind: 'removed', removedBy,
// reason }`...), but `@cerca/contract`'s real `listingStatusSchema` is a plain enum; the
// richer shape was never actually implemented. Verified directly against
// packages/contract/src/listing/listing.schemas.ts in cerca-api, not assumed from the doc —
// see US-02-HOME-SEARCH.md §6 for what trusting the doc over the real contract already cost.
export const listingStatusSchema = z.enum(['draft', 'published', 'paused', 'under_review', 'removed']);
export type ListingStatus = z.infer<typeof listingStatusSchema>;

// GET /listings/:id, and what POST /listings and POST /listings/:id/publish return: the full
// listing, including the complete `pricing` model (search results only get the flattened
// `priceFrom`).
export const listingSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  categoryId: z.string(),
  title: z.string(),
  description: z.string(),
  pricing: pricingSchema,
  priceFrom: moneySchema.nullable(),
  status: listingStatusSchema,
  ratingAvg: z.number(),
  ratingCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export type Listing = z.infer<typeof listingSchema>;

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
