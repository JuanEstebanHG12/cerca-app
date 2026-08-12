import { z } from 'zod';
import { currencyCodeSchema } from '../../domain/models/money';
import { localPhotoSchema } from '../../domain/models/listing-photo';

// Not part of `createListingInputSchema` (@cerca/contract has no `photos` field on
// POST /listings, and the backend's `.strict()` would reject one) — photos travel to the
// server through their own endpoint (`photos:presign` + a direct upload), not the create
// payload. They live in the form only so the wizard step and the draft-resume flow can hold
// them; `toCreateListingInput` never reads this field.

export const PRICING_MODEL_OPTIONS = ['fixed', 'hourly', 'quote'] as const;
export type PricingModelOption = (typeof PRICING_MODEL_OPTIONS)[number];

// Not every currency the backend would accept — a small, real set of what the product
// actually needs today. `currencyCodeSchema` below still validates it's a real ISO code,
// not this list, so nothing here contradicts the backend's own contract.
export const CURRENCY_OPTIONS = ['COP', 'MXN', 'USD'] as const;

// One flat shape for all three wizard steps — a single RHF instance is what "RHF multipaso"
// means in practice (Cerca.md): switching steps changes which fields are *visible*, not which
// form owns them, so nothing is lost tabbing back and forth. Amounts stay raw strings here
// (what a `TextInput` actually produces) — `toCreateListingInput` is where they become the
// integer `Money.amountMinor` the backend expects. There is no `quote` price field at all: the
// acceptance criterion is literal — "'presupuesto' no pide precio" — so `pricing: { model:
// 'quote' }` always ships with `startingFrom` omitted, even though the backend would accept one.
//
// Split in two on purpose: `publishFormShapeSchema` is just the types, no cross-field rules,
// and is what the *stored draft* is validated against — a draft is by definition incomplete
// (that's the whole point of "el borrador se puede retomar"), so it must never be rejected for
// failing rules it hasn't gotten to yet. `publishFormSchema` adds those rules on top and is
// what RHF's resolver actually enforces before letting a step advance or the form submit.
export const publishFormShapeSchema = z.object({
  categoryId: z.string().min(1, 'Elige una categoría.'),
  title: z.string().min(3, 'Mínimo 3 caracteres.').max(120, 'Máximo 120 caracteres.'),
  description: z.string().min(1, 'Describe tu servicio.').max(4000, 'Máximo 4000 caracteres.'),
  pricingModel: z.enum(PRICING_MODEL_OPTIONS),
  currency: currencyCodeSchema,
  fixedAmount: z.string(),
  hourlyRateAmount: z.string(),
  minimumHours: z.string(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  // No `.default()` here (unlike every other field): zod's `.default()` makes the input type
  // optional while the output type stays required, and that divergence is what breaks
  // zodResolver's generics (RHF needs one consistent shape for both). PUBLISH_FORM_DEFAULTS
  // already seeds `photos: []`, so the default is redundant here anyway.
  photos: z.array(localPhotoSchema),
});

export const publishFormSchema = publishFormShapeSchema.superRefine((values, ctx) => {
  // "Elegir 'por hora' pide horas mínimas; 'presupuesto' no pide precio" (Cerca.md, US-03) —
  // this is where that sentence becomes an actual rule instead of just a label on a field.
  if (values.pricingModel === 'fixed' && !isPositiveAmount(values.fixedAmount)) {
    ctx.addIssue({ code: 'custom', path: ['fixedAmount'], message: 'Ingresa un precio válido.' });
  }
  if (values.pricingModel === 'hourly') {
    if (!isPositiveAmount(values.hourlyRateAmount)) {
      ctx.addIssue({ code: 'custom', path: ['hourlyRateAmount'], message: 'Ingresa una tarifa válida.' });
    }
    // Mirrors the backend's own rule exactly (@cerca/contract, pricingSchema:
    // `minimumHours: z.number().int().min(1).max(12)`) — without this, "1.5" or "20" pass the
    // client's `isPositiveAmount` check, reach POST /listings, and 400 there instead, which is
    // where "Revisa los datos del formulario" without saying which field was coming from.
    if (!isIntegerInRange(values.minimumHours, 1, 12)) {
      ctx.addIssue({ code: 'custom', path: ['minimumHours'], message: 'Ingresa un número entero de 1 a 12.' });
    }
  }
  if (values.lat === null || values.lng === null) {
    ctx.addIssue({ code: 'custom', path: ['lat'], message: 'Necesitamos tu ubicación.' });
  }
});
export type PublishFormValues = z.infer<typeof publishFormSchema>;

export const PUBLISH_FORM_DEFAULTS: PublishFormValues = {
  categoryId: '',
  title: '',
  description: '',
  pricingModel: 'fixed',
  currency: 'COP',
  fixedAmount: '',
  hourlyRateAmount: '',
  minimumHours: '',
  lat: null,
  lng: null,
  photos: [],
};

// Every step's fields, for RHF's `trigger(fields)` — validating only the visible step before
// letting "Siguiente" advance, instead of surfacing step-3 errors while the user is on step 1.
export const STEP_FIELDS: Record<number, (keyof PublishFormValues)[]> = {
  0: ['categoryId', 'title', 'description'],
  1: ['pricingModel', 'currency', 'fixedAmount', 'hourlyRateAmount', 'minimumHours'],
  2: ['lat', 'lng'],
  // Photos have no validation rule (optional — see PublishStepPhotos), but the entry stays here
  // so STEP_FIELDS keeps documenting every step's fields, not just the ones with rules.
  3: ['photos'],
};

function isPositiveAmount(value: string): boolean {
  const amount = Number(value);
  return value.trim() !== '' && Number.isFinite(amount) && amount > 0;
}

function isIntegerInRange(value: string, min: number, max: number): boolean {
  const amount = Number(value);
  return value.trim() !== '' && Number.isInteger(amount) && amount >= min && amount <= max;
}
