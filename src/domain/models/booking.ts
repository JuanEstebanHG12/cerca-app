import { z } from 'zod';

// Mirrors the wire shape exactly (@cerca/contract, bookingResponseSchema): `status` is a flat
// enum on the wire, same as Listing's — the rich `{ kind: 'accepted', acceptedAt, scheduledFor }`
// union Cerca.md describes lives server-side only (booking.presenter.ts flattens it to
// `status.kind`, verified directly, not assumed — same pattern as listing.ts already found for
// US-02). `requestedAt`/`scheduledFor`/`completedAt` arrive as separate top-level nullable
// fields instead of nested inside the status.
export const bookingStatusSchema = z.enum(['requested', 'accepted', 'declined', 'completed', 'cancelled']);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const bookingSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  customerId: z.string(),
  status: bookingStatusSchema,
  requestedAt: z.string(),
  scheduledFor: z.string().nullable(),
  completedAt: z.string().nullable(),
  reviewId: z.string().nullable(),
});
export type Booking = z.infer<typeof bookingSchema>;
