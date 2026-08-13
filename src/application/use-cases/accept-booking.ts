import { ManageBookingError, ManageBookingFailureReason } from '../../domain/errors/booking-errors';
import { Booking } from '../../domain/models/booking';
import { AcceptBookingInput } from '../../domain/models/manage-booking';
import { BookingGateway } from '../ports/booking-gateway';

export type AcceptBookingResult = { ok: true; booking: Booking } | { ok: false; reason: ManageBookingFailureReason };

export class AcceptBookingUseCase {
  constructor(private readonly bookingGateway: BookingGateway) {}

  async execute(id: string, input: AcceptBookingInput, accessToken: string): Promise<AcceptBookingResult> {
    try {
      const booking = await this.bookingGateway.accept(id, input, accessToken);
      return { ok: true, booking };
    } catch (error) {
      if (error instanceof ManageBookingError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
