import { z } from 'zod';

// Mirrors @cerca/contract's report.schemas.ts exactly — verified against the real cerca-api
// source before writing this, not assumed from Cerca.md (same discipline as every model in this
// app since US-02 §6, where trusting the doc over the real contract broke Home on first load).
export const reportStatusSchema = z.enum(['open', 'resolved', 'dismissed']);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

// What GET /reports and POST /listings/:id/report return. Deliberately thin: no embedded
// listing title/owner/status — just `listingId`. The moderation queue has to fetch each
// listing separately (see ModerationQueueRow), the same per-row lazy-query shape
// app/(app)/bookings/index.tsx already uses for "Mis reservas".
export const reportSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  reporterId: z.string(),
  reason: z.string(),
  status: reportStatusSchema,
  createdAt: z.string(),
});
export type Report = z.infer<typeof reportSchema>;

export const reportsPageSchema = z.object({
  items: z.array(reportSchema),
  nextCursor: z.string().nullable(),
});
export type ReportsPage = z.infer<typeof reportsPageSchema>;

// What POST /listings/:id/report accepts. Free text only — there is no reason enum ('spam',
// 'fraud', ...) in the real schema, unlike what a first read of Cerca.md might suggest.
export interface CreateReportInput {
  reason: string;
}

// What POST /reports/:id/resolve accepts. `action` only ever changes the Report's own status —
// it never touches the Listing (see ResolveModerationUseCase for why the app calls this and
// listing-gateway's `moderate` as two separate calls to fulfil US-09).
export interface ResolveReportInput {
  action: 'remove' | 'dismiss';
  note?: string;
}
