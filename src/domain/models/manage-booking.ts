import { z } from 'zod';

// These are what a provider (the listing's owner) sends to move a booking along —
// POST /bookings/:id/accept and POST /bookings/:id/decline. Mirrors @cerca/contract exactly.
export const acceptBookingInputSchema = z.object({
  scheduledFor: z.string(),
});
export type AcceptBookingInput = z.infer<typeof acceptBookingInputSchema>;

export const DECLINE_REASON_OPTIONS = ['unavailable', 'not_a_fit', 'other'] as const;
export type DeclineReason = (typeof DECLINE_REASON_OPTIONS)[number];

export const declineBookingInputSchema = z.object({
  reason: z.enum(DECLINE_REASON_OPTIONS),
});
export type DeclineBookingInput = z.infer<typeof declineBookingInputSchema>;
