import { ReviewGateway } from '../../application/ports/review-gateway';
import { WriteReviewError, WriteReviewFailureReason } from '../../domain/errors/review-errors';
import { Review, reviewPageSchema, reviewSchema, ReviewPage, WriteReviewInput } from '../../domain/models/review';
import { ApiError, NetworkError } from './api-errors';
import { httpClient } from './http-client';

const REVIEW_BLOCKED_REASONS: readonly WriteReviewFailureReason[] = [
  'not_your_booking',
  'not_completed',
  'already_reviewed',
  'window_closed',
];

export class ReviewApiGateway implements ReviewGateway {
  async write(bookingId: string, input: WriteReviewInput, idempotencyKey: string, accessToken: string): Promise<Review> {
    try {
      const raw = await httpClient.post<unknown>(`/bookings/${bookingId}/review`, input, accessToken, {
        'Idempotency-Key': idempotencyKey,
      });
      return reviewSchema.parse(raw);
    } catch (error) {
      throw toWriteReviewError(error);
    }
  }

  // Public, no accessToken — same as ListingApiGateway.search(), errors here aren't wrapped
  // into a domain error type because there's no interesting business reason to distinguish:
  // it either works or it's a plain network/server problem.
  async listByListing(listingId: string): Promise<ReviewPage> {
    const raw = await httpClient.get<unknown>(`/listings/${listingId}/reviews?limit=50`);
    return reviewPageSchema.parse(raw);
  }
}

function toWriteReviewError(error: unknown): WriteReviewError {
  if (error instanceof ApiError) {
    // REVIEW_BLOCKED can arrive as 403 OR 409 depending on which of the four reasons fired
    // (cerca-api's write-review.use-case.ts) — so this checks `reason` first, before status,
    // instead of assuming "403 means one thing, 409 means another".
    if (isReviewBlockedReason(error.reason)) {
      return new WriteReviewError(error.reason, error.message);
    }
    if (error.status === 404) return new WriteReviewError('not_found', error.message);
    if (error.status === 422 || error.status === 400) return new WriteReviewError('validation_error', error.message);
    return new WriteReviewError('unexpected_error', error.message);
  }
  if (error instanceof NetworkError) return new WriteReviewError('network_error', error.message);
  return new WriteReviewError('unexpected_error', error instanceof Error ? error.message : undefined);
}

function isReviewBlockedReason(reason: string | undefined): reason is WriteReviewFailureReason {
  return reason !== undefined && (REVIEW_BLOCKED_REASONS as readonly string[]).includes(reason);
}
