import { WriteReviewError, WriteReviewFailureReason } from '../../domain/errors/review-errors';
import { Review, WriteReviewInput } from '../../domain/models/review';
import { ReviewGateway } from '../ports/review-gateway';

export type WriteReviewResult = { ok: true; review: Review } | { ok: false; reason: WriteReviewFailureReason };

export class WriteReviewUseCase {
  constructor(private readonly reviewGateway: ReviewGateway) {}

  async execute(
    bookingId: string,
    input: WriteReviewInput,
    idempotencyKey: string,
    accessToken: string,
  ): Promise<WriteReviewResult> {
    try {
      const review = await this.reviewGateway.write(bookingId, input, idempotencyKey, accessToken);
      return { ok: true, review };
    } catch (error) {
      if (error instanceof WriteReviewError) {
        return { ok: false, reason: error.reason };
      }
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
