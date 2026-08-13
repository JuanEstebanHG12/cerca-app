// Hierarchical, same shape as listing-keys.ts/booking-keys.ts: invalidating reportKeys.queue()
// drops every cached page of the open-reports queue without touching anything else.
export const reportKeys = {
  all: () => ['reports'] as const,
  queue: () => [...reportKeys.all(), 'queue'] as const,
};
