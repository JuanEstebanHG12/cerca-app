import { z } from 'zod';

// Mirrors POST /bookings' request body exactly (@cerca/contract, createBookingSchema, `.strict()`).
// `note` is optional — Cerca.md's acceptance criterion for US-05 doesn't ask for one, so the
// screen doesn't collect it; the field exists here only because the wire schema does, and
// omitting it entirely from the payload (not sending `note: undefined`) is what `.strict()`
// expects.
export const createBookingInputSchema = z.object({
  listingId: z.uuid(),
  note: z.string().max(500).optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;
