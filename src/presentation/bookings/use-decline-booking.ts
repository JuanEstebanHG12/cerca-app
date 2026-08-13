import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DeclineBookingUseCase } from '../../application/use-cases/decline-booking';
import { DeclineBookingInput } from '../../domain/models/manage-booking';
import { BookingApiGateway } from '../../infrastructure/api/booking-api-gateway';
import { useAuth } from '../auth/auth-context';
import { bookingKeys } from './booking-keys';

const declineBooking = new DeclineBookingUseCase(new BookingApiGateway());

export function useDeclineBooking(bookingId: string) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeclineBookingInput) => {
      if (!accessToken) return { ok: false as const, reason: 'unexpected_error' as const };
      return declineBooking.execute(bookingId, input, accessToken);
    },
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(bookingKeys.detail(bookingId), result.booking);
      }
    },
  });
}
