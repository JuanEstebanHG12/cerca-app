import { GetBookingError, GetBookingFailureReason } from '../../domain/errors/booking-errors';
import { Booking } from '../../domain/models/booking';
import { BookingGateway } from '../ports/booking-gateway';

export type GetBookingResult = { ok: true; booking: Booking } | { ok: false; reason: GetBookingFailureReason };

export class GetBookingUseCase {
  constructor(private readonly bookingGateway: BookingGateway) {}

  async execute(id: string, accessToken: string): Promise<GetBookingResult> {
    try {
      const booking = await this.bookingGateway.getById(id, accessToken);
      return { ok: true, booking };
    } catch (error) {
      if (error instanceof GetBookingError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
