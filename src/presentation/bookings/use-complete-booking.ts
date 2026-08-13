import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CompleteBookingUseCase } from '../../application/use-cases/complete-booking';
import { BookingApiGateway } from '../../infrastructure/api/booking-api-gateway';
import { useAuth } from '../auth/auth-context';
import { bookingKeys } from './booking-keys';

const completeBooking = new CompleteBookingUseCase(new BookingApiGateway());

export function useCompleteBooking(bookingId: string) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!accessToken) return { ok: false as const, reason: 'unexpected_error' as const };
      return completeBooking.execute(bookingId, accessToken);
    },
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(bookingKeys.detail(bookingId), result.booking);
      }
    },
  });
}
