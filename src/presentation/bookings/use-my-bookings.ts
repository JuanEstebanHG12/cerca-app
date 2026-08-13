import { useQuery } from '@tanstack/react-query';
import { ListMyBookingsUseCase } from '../../application/use-cases/list-my-bookings';
import { BookingApiGateway } from '../../infrastructure/api/booking-api-gateway';
import { useAuth } from '../auth/auth-context';
import { bookingKeys } from './booking-keys';

const listMyBookings = new ListMyBookingsUseCase(new BookingApiGateway());

// Provider-only for now (see the 'role' param) — nothing in the app needs "my bookings as a
// customer" yet, since requesting one already navigates straight to its detail screen.
//
// `staleTime: 0`, same reason as use-booking.ts: a new booking request can show up at any time,
// and this list should show it the next time the provider opens the screen, not up to a minute
// later.
export function useMyBookings(role: 'customer' | 'provider') {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: [...bookingKeys.all(), 'mine', role],
    queryFn: async () => {
      if (!accessToken) throw new Error('unexpected_error');
      const result = await listMyBookings.execute(role, accessToken);
      if (!result.ok) throw new Error(result.reason);
      return result.page;
    },
    enabled: accessToken !== null,
    staleTime: 0,
  });
}
