// Hierarchical, same shape as listing-keys.ts: invalidating bookingKeys.all() drops every
// booking query at once. There's no `mine()`/list key yet — US-05 only needs a single booking's
// detail (see US-05-REQUEST-BOOKING.md §5 for why a bookings list isn't built).
export const bookingKeys = {
  all: () => ['bookings'] as const,
  details: () => [...bookingKeys.all(), 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
};
