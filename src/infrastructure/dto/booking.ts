import { z } from 'zod';

export const createBookingRequestSchema = z.object({
  listingId: z.string().uuid(),
  note: z.string().max(500).optional(),
});
export type CreateBookingApiRequestDto = z.infer<typeof createBookingRequestSchema>;

export const acceptBookingRequestSchema = z.object({
  scheduledFor: z.string().datetime(),
});
export type AcceptBookingApiRequestDto = z.infer<typeof acceptBookingRequestSchema>;

export const declineBookingRequestSchema = z.object({
  reason: z.enum(['unavailable', 'not_a_fit', 'other']),
});
export type DeclineBookingApiRequestDto = z.infer<typeof declineBookingRequestSchema>;

export const bookingRoleQuerySchema = z.object({
  role: z.enum(['customer', 'provider']),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20).optional(),
});
export type BookingRoleApiQueryDto = z.infer<typeof bookingRoleQuerySchema>;
