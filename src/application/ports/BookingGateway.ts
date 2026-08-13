import { Booking, BookingId, ReviewId } from '../../domain/booking';
import { ListingId } from '../../domain/listing';

export interface CreateBookingData {
  listingId: ListingId;
  scheduledFor: string;
  notes?: string;
  idempotencyKey: string;
}

export interface CreateReviewData {
  rating: number;
  comment: string;
  idempotencyKey: string;
}

export interface BookingGateway {
  requestBooking(data: CreateBookingData): Promise<Booking>;
  getBookings(role: 'customer' | 'provider'): Promise<Booking[]>;
  getBookingDetail(id: BookingId): Promise<Booking>;
  acceptBooking(id: BookingId, scheduledFor: string): Promise<Booking>;
  declineBooking(id: BookingId, reason: string): Promise<Booking>;
  completeBooking(id: BookingId): Promise<Booking>;
  cancelBooking(id: BookingId): Promise<Booking>;
  createReview(bookingId: BookingId, data: CreateReviewData): Promise<{ reviewId: ReviewId }>;
}
