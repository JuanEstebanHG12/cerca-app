import { formatMoney, Money } from '../../domain/models/money';
import { formatDistance as formatDistanceForLocale } from '../../domain/formatting/distance';
import { ListingStatus } from '../../domain/models/listing';

// Search results only carry `priceFrom` (a single Money or null), not the full pricing model
// with its per-model context ("/ hora · mínimo 2 h") — that only exists on the listing detail
// endpoint. `null` means the listing has no price to show yet.
export function formatPriceFromLabel(priceFrom: Money | null, locale: string): { amount: string; context?: string } {
  return priceFrom ? { amount: formatMoney(priceFrom, locale) } : { amount: 'Cotización a medida' };
}

// "4,8 · 200 reseñas" with correct plurals at 0/1/2 — the DoD checks all three explicitly.
export function formatRatingSummary(ratingAvg: number, ratingCount: number): string {
  if (ratingCount === 0) return 'Sin reseñas todavía';
  const stars = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(ratingAvg);
  const reviews = ratingCount === 1 ? '1 reseña' : `${ratingCount} reseñas`;
  return `${stars} · ${reviews}`;
}

// Delegates to the locale-aware formatter (US-07: km for most locales, miles for the
// US/Liberia/Myanmar readers) instead of a second, hardcoded-to-kilometers implementation.
export function formatDistance(distanceMeters: number, locale: string): string {
  return `a ${formatDistanceForLocale(distanceMeters, locale)}`;
}

// Only non-published states need a badge: a live listing needs no explanation, a paused one
// does — and it has to say so in text, never rely on badge color alone.
export function statusBadgeLabel(status: ListingStatus): string | null {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'paused':
      return 'Pausado';
    case 'under_review':
      return 'En revisión';
    case 'removed':
      return 'Retirado';
    case 'published':
      return null;
  }
}
