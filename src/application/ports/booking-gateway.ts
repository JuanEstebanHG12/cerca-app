import { Booking, BookingPage } from '../../domain/models/booking';
import { CreateBookingInput } from '../../domain/models/create-booking';
import { AcceptBookingInput, DeclineBookingInput } from '../../domain/models/manage-booking';

// Port: the application knows requesting a booking needs an idempotency key and that fetching
// one by id can fail because it doesn't exist *or* because the caller isn't a party to it (the
// server intentionally returns 404 for both — see GetBookingError). It has no idea `request` is
// a POST with an `Idempotency-Key` header, or what happens if that header is reused — that
// lives behind BookingApiGateway in src/infrastructure/api.
export interface BookingGateway {
  request(input: CreateBookingInput, idempotencyKey: string, accessToken: string): Promise<Booking>;
  getById(id: string, accessToken: string): Promise<Booking>;
  // 'provider' is the only role this app's UI needs today — see use-my-bookings.ts.
  listMine(role: 'customer' | 'provider', accessToken: string): Promise<BookingPage>;
  accept(id: string, input: AcceptBookingInput, accessToken: string): Promise<Booking>;
  decline(id: string, input: DeclineBookingInput, accessToken: string): Promise<Booking>;
  complete(id: string, accessToken: string): Promise<Booking>;
}
