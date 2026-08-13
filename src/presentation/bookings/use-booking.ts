import { useQuery } from '@tanstack/react-query';
import { GetBookingUseCase } from '../../application/use-cases/get-booking';
import { BookingApiGateway } from '../../infrastructure/api/booking-api-gateway';
import { useAuth } from '../auth/auth-context';
import { bookingKeys } from './booking-keys';

const getBooking = new GetBookingUseCase(new BookingApiGateway());

// Always refetches on mount rather than trusting a stale cache — this is the query that has to
// answer "el estado se refleja al volver atrás" (Cerca.md, US-05): the booking detail screen is
// reachable again after backgrounding the app or navigating away and back, and its status can
// have changed server-side (accepted/declined/completed) without this screen doing anything.
//
// Bug found by hand-testing: the app's global default is `staleTime: 60_000` (query-client.ts)
// — for most data (search results, a listing) that's the right call, but here it meant coming
// back to this exact screen within a minute of the last visit showed the *old* status from
// cache, not the real one, even though the comment above already claimed otherwise. `staleTime:
// 0` overrides that just for this query: React Query treats cached booking data as stale the
// instant it's older than zero seconds, so every time this screen mounts, it asks the server
// again instead of trusting what it already had.
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
    staleTime: 0,
    retry: (failureCount, error) => error.message !== 'not_found' && failureCount < 2,
  });
}
