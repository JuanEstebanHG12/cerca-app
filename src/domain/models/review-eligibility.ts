import { Booking } from './booking';

// This is "la política estrella" from Cerca.md — the one rule with four different kinds of
// conditions (who you are, what state the booking is in, whether you already did this, and how
// much time has passed). The real backend rule lives in @cerca/contract's canReviewBooking; this
// file is a hand-copied mirror of it (same reason cerca-app already mirrors canEditListing and
// canRequestBooking — the app doesn't import @cerca/contract directly, see README's known gaps).
//
// It only decides what the SCREEN shows (button enabled/disabled, which message). The server
// runs the real check again on every POST — this file never protects anything by itself.
export type ReviewBlockedReason = 'not_your_booking' | 'not_completed' | 'already_reviewed' | 'window_closed';
export type ReviewEligibility = { ok: true } | { ok: false; reason: ReviewBlockedReason };

export const REVIEW_WINDOW_DAYS = 30;

function daysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

// `now` is a parameter instead of calling `new Date()` inside — Cerca.md explains why: it keeps
// this function pure (same inputs always give the same answer), which matters if this is ever
// tested, and it means the caller controls "what time is it" instead of this function guessing.
export function canReviewBooking(customerId: string, booking: Booking, now: Date): ReviewEligibility {
  if (booking.customerId !== customerId) {
    return { ok: false, reason: 'not_your_booking' };
  }
  if (booking.status !== 'completed' || booking.completedAt === null) {
    return { ok: false, reason: 'not_completed' };
  }
  if (booking.reviewId !== null) {
    return { ok: false, reason: 'already_reviewed' };
  }
  if (daysBetween(new Date(booking.completedAt), now) > REVIEW_WINDOW_DAYS) {
    return { ok: false, reason: 'window_closed' };
  }
  return { ok: true };
}
