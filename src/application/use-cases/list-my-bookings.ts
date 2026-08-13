import { GetBookingError, GetBookingFailureReason } from '../../domain/errors/booking-errors';
import { BookingPage } from '../../domain/models/booking';
import { BookingGateway } from '../ports/booking-gateway';

export type ListMyBookingsResult = { ok: true; page: BookingPage } | { ok: false; reason: GetBookingFailureReason };

export class ListMyBookingsUseCase {
  constructor(private readonly bookingGateway: BookingGateway) {}

  async execute(role: 'customer' | 'provider', accessToken: string): Promise<ListMyBookingsResult> {
    try {
      const page = await this.bookingGateway.listMine(role, accessToken);
      return { ok: true, page };
    } catch (error) {
      if (error instanceof GetBookingError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
