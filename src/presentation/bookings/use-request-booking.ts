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
// (422 without it) and deduplicates same-key-same-body requests.
//
// The key is regenerated after every attempt finishes (onSettled), not just once when the screen
// mounts. Bug found by hand-testing: with a key fixed for the whole screen's lifetime, tapping
// "Solicitar reserva" a second time — for what the user means as a brand new booking — sent the
// exact same key + the exact same body ({listingId}) as the first tap. The server correctly saw
// that as "the same request as before" and replayed the *first* booking instead of creating a
// second one, which looked like the booking date silently not updating. Rotating the key once
// the previous attempt is done keeps the "reuse this key while retrying the same tap" protection
// (nothing here changes mid-request) while still treating a later, separate tap as what it is —
// a new booking.
export function useRequestBooking(listingId: string) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [idempotencyKey, setIdempotencyKey] = useState(() => Crypto.randomUUID());

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
    onSettled: () => setIdempotencyKey(Crypto.randomUUID()),
  });
}
