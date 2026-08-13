// What POST /listings/:id/moderate accepts (@cerca/contract's moderateListingSchema, `.strict()`):
// an action and a mandatory reason (1-500 chars) — unlike ResolveReportInput's `note`, this one
// isn't optional, because `Listing.status` is changing, not just closing a queue entry.
export interface ModerateListingInput {
  action: 'under_review' | 'removed';
  reason: string;
}
