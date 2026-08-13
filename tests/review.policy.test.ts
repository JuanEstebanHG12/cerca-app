import { describe, it, expect } from 'vitest';
import { canReviewBooking, REVIEW_WINDOW_DAYS } from '../src/domain/review.policy';
import { Actor } from '../src/domain/actor';
import { Booking } from '../src/domain/booking';

const customer: Actor = {
  id: 'user-customer',
  name: 'Ana',
  email: 'ana@cerca.app',
  capacities: ['customer'],
  platformRole: 'user',
};

const otherUser: Actor = {
  id: 'user-other',
  name: 'Pedro',
  email: 'pedro@cerca.app',
  capacities: ['customer'],
  platformRole: 'user',
};

const now = new Date('2026-08-13T12:00:00Z');

const completedRecent: Booking = {
  id: 'b1',
  listingId: 'l1',
  listingTitle: 'Fontanería',
  listingCoverImage: '',
  customerId: 'user-customer',
  customerName: 'Ana',
  providerId: 'user-provider',
  providerName: 'Carlos',
  status: { kind: 'completed', completedAt: new Date(now.getTime() - 5 * 86400000).toISOString() },
  scheduledFor: '2026-08-08T10:00:00Z',
  reviewId: null,
  createdAt: '2026-08-07T09:00:00Z',
};

describe('canReviewBooking', () => {
  it('ok: todos los criterios se cumplen', () => {
    const result = canReviewBooking(customer, completedRecent, now);
    expect(result.ok).toBe(true);
  });

  it('not_your_booking: otro usuario no puede reseñar', () => {
    const result = canReviewBooking(otherUser, completedRecent, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('not_your_booking');
  });

  it('not_completed: no se puede reseñar una reserva no completada', () => {
    const pending: Booking = {
      ...completedRecent,
      status: { kind: 'requested', requestedAt: now.toISOString() },
    };
    const result = canReviewBooking(customer, pending, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('not_completed');
  });

  it('already_reviewed: no se puede reseñar dos veces', () => {
    const alreadyReviewed: Booking = { ...completedRecent, reviewId: 'rev-existing' };
    const result = canReviewBooking(customer, alreadyReviewed, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('already_reviewed');
  });

  it('window_closed: fuera del plazo de 30 días', () => {
    const expiredAt = new Date(now.getTime() - (REVIEW_WINDOW_DAYS + 1) * 86400000).toISOString();
    const expired: Booking = {
      ...completedRecent,
      status: { kind: 'completed', completedAt: expiredAt },
    };
    const result = canReviewBooking(customer, expired, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('window_closed');
  });

  it('evalúa en el borde exacto de 30 días (aún válido)', () => {
    const exactLimit = new Date(now.getTime() - REVIEW_WINDOW_DAYS * 86400000).toISOString();
    const borderBooking: Booking = {
      ...completedRecent,
      status: { kind: 'completed', completedAt: exactLimit },
    };
    const result = canReviewBooking(customer, borderBooking, now);
    expect(result.ok).toBe(true);
  });
});
