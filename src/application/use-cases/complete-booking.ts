import { ManageBookingError, ManageBookingFailureReason } from '../../domain/errors/booking-errors';
import { Booking } from '../../domain/models/booking';
import { BookingGateway } from '../ports/booking-gateway';

export type CompleteBookingResult = { ok: true; booking: Booking } | { ok: false; reason: ManageBookingFailureReason };

export class CompleteBookingUseCase {
  constructor(private readonly bookingGateway: BookingGateway) {}

  async execute(id: string, accessToken: string): Promise<CompleteBookingResult> {
    try {
      const booking = await this.bookingGateway.complete(id, accessToken);
      return { ok: true, booking };
    } catch (error) {
      if (error instanceof ManageBookingError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
