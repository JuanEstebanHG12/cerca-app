import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AcceptBookingUseCase } from '../../application/use-cases/accept-booking';
import { AcceptBookingInput } from '../../domain/models/manage-booking';
import { BookingApiGateway } from '../../infrastructure/api/booking-api-gateway';
import { useAuth } from '../auth/auth-context';
import { bookingKeys } from './booking-keys';

const acceptBooking = new AcceptBookingUseCase(new BookingApiGateway());

// No idempotency key here — unlike request/review, accept isn't marked @Idempotent() in
// cerca-api. Accepting twice isn't destructive the way double-booking would be: the second
// attempt just gets rejected with 'invalid_state' (already accepted), which the screen shows
// like any other error.
export function useAcceptBooking(bookingId: string) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AcceptBookingInput) => {
      if (!accessToken) return { ok: false as const, reason: 'unexpected_error' as const };
      return acceptBooking.execute(bookingId, input, accessToken);
    },
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(bookingKeys.detail(bookingId), result.booking);
      }
    },
  });
}
