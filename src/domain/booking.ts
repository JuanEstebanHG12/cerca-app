import { z } from 'zod';
import { UserId } from './actor';
import { ListingId } from './listing';

export type BookingId = string;
export type ReviewId = string;

export type BookingStatus =
  | { kind: 'requested'; requestedAt: string }
  | { kind: 'accepted'; acceptedAt: string; scheduledFor: string }
  | { kind: 'declined'; reason: string }
  | { kind: 'completed'; completedAt: string }
  | { kind: 'cancelled'; cancelledBy: UserId; at: string };

export interface Booking {
  id: BookingId;
  listingId: ListingId;
  listingTitle: string;
  listingCoverImage: string;
  customerId: UserId;
  customerName: string;
  providerId: UserId;
  providerName: string;
  status: BookingStatus;
  scheduledFor: string;
  notes?: string;
  reviewId: ReviewId | null;
  createdAt: string;
}

export const bookingStatusSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('requested'), requestedAt: z.string() }),
  z.object({ kind: z.literal('accepted'), acceptedAt: z.string(), scheduledFor: z.string() }),
  z.object({ kind: z.literal('declined'), reason: z.string() }),
  z.object({ kind: z.literal('completed'), completedAt: z.string() }),
  z.object({ kind: z.literal('cancelled'), cancelledBy: z.string(), at: z.string() }),
]);

export const bookingSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  listingTitle: z.string(),
  listingCoverImage: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  providerId: z.string(),
  providerName: z.string(),
  status: bookingStatusSchema,
  scheduledFor: z.string(),
  notes: z.string().optional(),
  reviewId: z.string().nullable(),
  createdAt: z.string(),
});
