// Shared by publish-form-schema.ts and edit-listing-form-schema.ts — both validate the same
// raw TextInput strings (amounts, minimumHours) against the same backend rules
// (@cerca/contract's pricingSchema), so the rule lives once instead of drifting between the
// two forms the way minimumHours already did once (see US-03-PUBLISH-LISTING.md §2, finding 3).
export function isPositiveAmount(value: string): boolean {
  const amount = Number(value);
  return value.trim() !== '' && Number.isFinite(amount) && amount > 0;
}

export function isIntegerInRange(value: string, min: number, max: number): boolean {
  const amount = Number(value);
  return value.trim() !== '' && Number.isInteger(amount) && amount >= min && amount <= max;
}
