import * as Crypto from 'expo-crypto';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RequestBookingUseCase } from '../../application/use-cases/request-booking';
import { BookingApiGateway } from '../../infrastructure/api/booking-api-gateway';
import { useAuth } from '../auth/auth-context';
import { bookingKeys } from './booking-keys';

const requestBooking = new RequestBookingUseCase(new BookingApiGateway());

// "La solicitud se envía una sola vez aunque pulse dos" (Cerca.md, US-05) is two independent
// defenses, not one: `mutation.isPending` disabling the button is what actually stops a second
// tap from firing a second request in normal use. The Idempotency-Key below is the backend's own
// safety net for whatever gets past that — cerca-api's POST /bookings requires the header
// (422 without it) and deduplicates same-key-same-body requests. Generated once per screen visit
// via lazy useState (not useRef(Crypto.randomUUID()), which would call randomUUID() on every
// render and just discard most of the results) — every retry of *this* attempt reuses the same
// key and body on purpose, so a duplicate in flight replays or 409s instead of double-booking.
export function useRequestBooking(listingId: string) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [idempotencyKey] = useState(() => Crypto.randomUUID());

  return useMutation({
    mutationFn: async () => {
      if (!accessToken) {
        // Can't happen through the UI (this only mounts while signed in) — same defensive shape
        // as useCreateListing's equivalent guard.
        return { ok: false as const, reason: 'unexpected_error' as const };
      }
      return requestBooking.execute({ listingId }, idempotencyKey, accessToken);
    },
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(bookingKeys.detail(result.booking.id), result.booking);
      }
    },
  });
}
