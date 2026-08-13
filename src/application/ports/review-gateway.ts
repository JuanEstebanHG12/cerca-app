import { Review, ReviewPage, WriteReviewInput } from '../../domain/models/review';

// Port: the application knows writing a review needs an idempotency key too (same reason
// requesting a booking does — see booking-gateway.ts). It doesn't know this is a POST to
// /bookings/:id/review — that lives behind ReviewApiGateway in src/infrastructure/api.
export interface ReviewGateway {
  write(bookingId: string, input: WriteReviewInput, idempotencyKey: string, accessToken: string): Promise<Review>;
  // Public — no accessToken. There's no GET /reviews/:id, only this list per listing.
  listByListing(listingId: string): Promise<ReviewPage>;
}
