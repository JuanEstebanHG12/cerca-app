import { z } from 'zod';

// What the app sends when writing a review. Mirrors the backend exactly
// (@cerca/contract, writeReviewSchema, `.strict()`): a star rating and a text body, nothing else.
export const writeReviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(2000),
});
export type WriteReviewInput = z.infer<typeof writeReviewInputSchema>;

// What POST /bookings/:id/review returns. Mirrors reviewResponseSchema.
export const reviewSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  listingId: z.string(),
  authorId: z.string(),
  rating: z.number().int(),
  body: z.string(),
  createdAt: z.string(),
});
export type Review = z.infer<typeof reviewSchema>;

// What GET /listings/:id/reviews returns — the only way to look up an existing review's
// content, since there's no GET /reviews/:id. review-section.tsx searches this page for the one
// matching a specific bookingId.
export const reviewPageSchema = z.object({
  items: z.array(reviewSchema),
  nextCursor: z.string().nullable(),
});
export type ReviewPage = z.infer<typeof reviewPageSchema>;
