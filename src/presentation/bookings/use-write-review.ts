import * as Crypto from 'expo-crypto';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WriteReviewUseCase } from '../../application/use-cases/write-review';
import { Booking } from '../../domain/models/booking';
import { WriteReviewInput } from '../../domain/models/review';
import { ReviewApiGateway } from '../../infrastructure/api/review-api-gateway';
import { useAuth } from '../auth/auth-context';
import { bookingKeys } from './booking-keys';

const writeReview = new WriteReviewUseCase(new ReviewApiGateway());

// Same idempotency pattern as use-request-booking.ts, including the same fix: the key rotates
// after each attempt (onSettled), not just once when the screen mounts. Otherwise, if a first
// submit failed and the user edited the rating/text and tried again, the same key would now be
// paired with a *different* body — the server rejects that combination outright
// (IDEMPOTENCY_KEY_REUSED) instead of treating it as the new attempt it actually is.
export function useWriteReview(bookingId: string) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [idempotencyKey, setIdempotencyKey] = useState(() => Crypto.randomUUID());

  return useMutation({
    mutationFn: async (input: WriteReviewInput) => {
      if (!accessToken) {
        return { ok: false as const, reason: 'unexpected_error' as const };
      }
      return writeReview.execute(bookingId, input, idempotencyKey, accessToken);
    },
    onSuccess: (result) => {
      if (result.ok) {
        // The booking's own `reviewId` is what canReviewBooking checks for "already reviewed" —
        // patch it into the cached booking so the screen flips to "ya reseñaste" immediately,
        // without waiting for a refetch.
        queryClient.setQueryData(bookingKeys.detail(bookingId), (old: Booking | undefined) =>
          old ? { ...old, reviewId: result.review.id } : old,
        );
      }
    },
    onSettled: () => setIdempotencyKey(Crypto.randomUUID()),
  });
}
