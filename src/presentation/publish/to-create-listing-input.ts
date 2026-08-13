import { CreateListingInput } from '../../domain/models/create-listing';
import { CurrencyCode, toMinorUnits } from '../../domain/models/money';
import { Pricing } from '../../domain/models/pricing';
import { PricingModelOption, PublishFormValues } from './publish-form-schema';

// Narrower than PublishFormValues on purpose: this is also reused by the edit listing form
// (src/presentation/listings/to-update-listing-input.ts), which shares these five fields but
// has none of the publish wizard's other ones (categoryId, lat/lng, photos).
export interface PricingFormValues {
  pricingModel: PricingModelOption;
  currency: CurrencyCode;
  fixedAmount: string;
  hourlyRateAmount: string;
  minimumHours: string;
}

// The only place the flat form shape turns into the wire shape `Pricing` requires — a
// discriminated union, so only the fields for the chosen model ever leave the device (Cerca.md:
// "si el modelo es 'presupuesto', el precio ni existe — ni en el tipo, ni en la pantalla").
export function toPricing(values: PricingFormValues): Pricing {
  switch (values.pricingModel) {
    case 'fixed':
      return { model: 'fixed', price: { amountMinor: toMinorUnits(Number(values.fixedAmount), values.currency), currency: values.currency } };
    case 'hourly':
      return {
        model: 'hourly',
        hourlyRate: { amountMinor: toMinorUnits(Number(values.hourlyRateAmount), values.currency), currency: values.currency },
        minimumHours: Number(values.minimumHours),
      };
    case 'quote':
      // No price field exists for this model in the wizard at all (see publish-form-schema.ts)
      // — the acceptance criterion is literal: "'presupuesto' no pide precio".
      return { model: 'quote', startingFrom: undefined };
  }
}

// Assumes `publishFormSchema` already validated `values` — in particular that lat/lng are not
// null. Called only from the final submit handler, after `handleSubmit` guarantees that.
export function toCreateListingInput(values: PublishFormValues): CreateListingInput {
  return {
    categoryId: values.categoryId,
    title: values.title.trim(),
    description: values.description.trim(),
    pricing: toPricing(values),
    location: { lat: values.lat as number, lng: values.lng as number },
  };
}
