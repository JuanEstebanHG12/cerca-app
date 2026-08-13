import { ModerateListingFailureReason } from '../../domain/errors/listing-errors';
import { ResolveReportFailureReason } from '../../domain/errors/report-errors';
import { ModerateListingUseCase } from './moderate-listing';
import { ResolveReportUseCase } from './resolve-report';

export type ModerationDecision = 'under_review' | 'removed' | 'dismiss';

// Three distinct outcomes, not a boolean (Cerca.md: "el error que van a cometer" is treating a
// policy result as ok/fail with no room for *why* or *how much*):
// - reportClosed: true          → both calls succeeded, or 'dismiss' needed only one.
// - reportClosed: false         → 'under_review': intentional, nothing failed (see execute()).
// - reportClosed: false + error → 'removed' succeeded but closing the report didn't; the listing
//   change already happened and is NOT rolled back.
export type ResolveModerationResult =
  | { ok: true; reportClosed: boolean; reportError?: ResolveReportFailureReason }
  | { ok: false; stage: 'listing'; reason: ModerateListingFailureReason }
  | { ok: false; stage: 'report'; reason: ResolveReportFailureReason };

// Orchestrates two backend endpoints that don't know about each other. Verified by reading
// cerca-api's resolve-report.use-case.ts directly: resolving a report only ever updates the
// Report row — it never calls ModerateListingUseCase or touches the listing repository, and
// moderating a listing doesn't require a reportId at all. Cerca.md's "cola de moderación" reads
// like one flow; the backend gives you two independent levers. This use-case is the one place
// that decides how they're wired together for US-09's acceptance criterion — see
// US-09-MODERATION-QUEUE.md §1 for the reasoning link-by-link.
//
// Same two-calls-one-action shape as BecomeProviderUseCase (US-03): one use-case, two gateway
// calls in sequence, composed here instead of in a presentation hook.
export class ResolveModerationUseCase {
  constructor(
    private readonly moderateListing: ModerateListingUseCase,
    private readonly resolveReport: ResolveReportUseCase,
  ) {}

  async execute(
    reportId: string,
    listingId: string,
    decision: ModerationDecision,
    note: string,
    accessToken: string,
  ): Promise<ResolveModerationResult> {
    // No violation found: only the Report changes, the listing is never touched.
    if (decision === 'dismiss') {
      const resolved = await this.resolveReport.execute(reportId, { action: 'dismiss', note: note || undefined }, accessToken);
      if (!resolved.ok) return { ok: false, stage: 'report', reason: resolved.reason };
      return { ok: true, reportClosed: true };
    }

    const moderated = await this.moderateListing.execute(listingId, { action: decision, reason: note }, accessToken);
    if (!moderated.ok) return { ok: false, stage: 'listing', reason: moderated.reason };

    if (decision === 'under_review') {
      // Deliberately does NOT resolve the report. 'under_review' is a holding action, not a
      // final call — ListReportsUseCase always filters to status: 'open' (cerca-api's
      // PrismaReportRepository.listOpen), so leaving it open is what keeps this entry visible
      // in the queue for whoever comes back to make the final removed/dismiss decision. This is
      // the expected shape, not a partial failure — hence no `reportError`.
      return { ok: true, reportClosed: false };
    }

    // decision === 'removed': the listing already changed — that's the effect Cerca.md's
    // acceptance criterion is actually about. Closing the report on top is best-effort, same
    // shape as US-03's photo upload (§1.3/§3.8 of US-03-PUBLISH-LISTING.md): a secondary call's
    // failure never undoes or hides a primary action that already succeeded.
    const resolved = await this.resolveReport.execute(reportId, { action: 'remove', note: note || undefined }, accessToken);
    if (!resolved.ok) return { ok: true, reportClosed: false, reportError: resolved.reason };
    return { ok: true, reportClosed: true };
  }
}
