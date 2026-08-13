import { useQuery } from '@tanstack/react-query';
import { GetBookingUseCase } from '../../application/use-cases/get-booking';
import { BookingApiGateway } from '../../infrastructure/api/booking-api-gateway';
import { useAuth } from '../auth/auth-context';
import { bookingKeys } from './booking-keys';

const getBooking = new GetBookingUseCase(new BookingApiGateway());

// Always refetches on mount rather than trusting a stale cache — this is the query that has to
// answer "el estado se refleja al volver atrás" (Cerca.md, US-05): the booking detail screen is
// reachable again after backgrounding the app or navigating away and back, and its status can
// have changed server-side (accepted/declined) without this screen doing anything.
export function useBooking(id: string) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: async () => {
      if (!accessToken) throw new Error('unexpected_error');
      const result = await getBooking.execute(id, accessToken);
      if (!result.ok) throw new Error(result.reason);
      return result.booking;
    },
    enabled: accessToken !== null,
    retry: (failureCount, error) => error.message !== 'not_found' && failureCount < 2,
  });
}
