import { Actor } from './actor';
import { Booking } from './booking';

export type ReviewBlockedReason =
  | 'not_your_booking'
  | 'not_completed'
  | 'already_reviewed'
  | 'window_closed';

export type ReviewEligibility = { ok: true } | { ok: false; reason: ReviewBlockedReason };

export const REVIEW_WINDOW_DAYS = 30;

function daysBetween(d1Str: string, d2: Date): number {
  const d1 = new Date(d1Str);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return diffMs / (1000 * 60 * 60 * 24);
}

export function canReviewBooking(actor: Actor, booking: Booking, now: Date): ReviewEligibility {
  if (booking.customerId !== actor.id) {
    return { ok: false, reason: 'not_your_booking' };
  }
  if (booking.status.kind !== 'completed') {
    return { ok: false, reason: 'not_completed' };
  }
  if (booking.reviewId !== null) {
    return { ok: false, reason: 'already_reviewed' };
  }
  if (daysBetween(booking.status.completedAt, now) > REVIEW_WINDOW_DAYS) {
    return { ok: false, reason: 'window_closed' };
  }
  return { ok: true };
}
