import { z } from 'zod';
import { currencyCodeSchema } from '../../domain/models/money';

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
    if (!isPositiveAmount(values.minimumHours)) {
      ctx.addIssue({ code: 'custom', path: ['minimumHours'], message: 'Indica las horas mínimas.' });
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
};

// Every step's fields, for RHF's `trigger(fields)` — validating only the visible step before
// letting "Siguiente" advance, instead of surfacing step-3 errors while the user is on step 1.
export const STEP_FIELDS: Record<number, (keyof PublishFormValues)[]> = {
  0: ['categoryId', 'title', 'description'],
  1: ['pricingModel', 'currency', 'fixedAmount', 'hourlyRateAmount', 'minimumHours'],
  2: ['lat', 'lng'],
};

function isPositiveAmount(value: string): boolean {
  const amount = Number(value);
  return value.trim() !== '' && Number.isFinite(amount) && amount > 0;
}
