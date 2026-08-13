import { RequestBookingError, RequestBookingFailureReason } from '../../domain/errors/booking-errors';
import { Booking } from '../../domain/models/booking';
import { CreateBookingInput } from '../../domain/models/create-booking';
import { BookingGateway } from '../ports/booking-gateway';

export type RequestBookingResult = { ok: true; booking: Booking } | { ok: false; reason: RequestBookingFailureReason };

export class RequestBookingUseCase {
  constructor(private readonly bookingGateway: BookingGateway) {}

  async execute(input: CreateBookingInput, idempotencyKey: string, accessToken: string): Promise<RequestBookingResult> {
    try {
      const booking = await this.bookingGateway.request(input, idempotencyKey, accessToken);
      return { ok: true, booking };
    } catch (error) {
      if (error instanceof RequestBookingError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
