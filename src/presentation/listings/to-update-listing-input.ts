import { UpdateListingInput } from '../../domain/models/update-listing';
import { toPricing } from '../publish/to-create-listing-input';
import { EditListingFormValues } from './edit-listing-form-schema';

const PRICING_FIELDS = ['pricingModel', 'currency', 'fixedAmount', 'hourlyRateAmount', 'minimumHours'] as const;

// Only the fields the user actually touched go in the PATCH body — never the full form, even
// though every field always has a valid value. The backend's own update-listing use-case reads
// `input.pricing !== undefined` to decide which policy to run: `canChangePrice` (blocked while
// accepted bookings exist) if pricing is present at all, `canEditListing` otherwise. Resending
// an unchanged price would make a pure title/description edit fail with 'has_pending_bookings'
// for a booking the user never touched — this is what RHF's `dirtyFields` exists to prevent.
export function toUpdateListingInput(
  values: EditListingFormValues,
  dirtyFields: Partial<Record<keyof EditListingFormValues, boolean>>,
): UpdateListingInput {
  const input: UpdateListingInput = {};
  if (dirtyFields.title) input.title = values.title.trim();
  if (dirtyFields.description) input.description = values.description.trim();
  if (PRICING_FIELDS.some((field) => dirtyFields[field])) input.pricing = toPricing(values);
  return input;
}
