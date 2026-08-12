import { z } from 'zod';
import { isIntegerInRange, isPositiveAmount } from '../../domain/models/amount-validation';
import { currencyCodeSchema } from '../../domain/models/money';
import { CURRENCY_OPTIONS, PRICING_MODEL_OPTIONS } from '../publish/publish-form-schema';

// Same shape family as the publish wizard's pricing step (title, description, and the five
// PricingFormValues fields) — deliberately without categoryId, lat/lng, or photos, because
// PATCH /listings/{id} doesn't accept any of those (updateListingSchema, @cerca/contract).
// There's no draft/shape split like publish-form-schema.ts: an edit always starts from a
// complete, already-published listing, so "incomplete and resumable later" doesn't apply here.
export const editListingFormSchema = z
  .object({
    title: z.string().min(3, 'Mínimo 3 caracteres.').max(120, 'Máximo 120 caracteres.'),
    description: z.string().min(1, 'Describe tu servicio.').max(4000, 'Máximo 4000 caracteres.'),
    pricingModel: z.enum(PRICING_MODEL_OPTIONS),
    currency: currencyCodeSchema,
    fixedAmount: z.string(),
    hourlyRateAmount: z.string(),
    minimumHours: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.pricingModel === 'fixed' && !isPositiveAmount(values.fixedAmount)) {
      ctx.addIssue({ code: 'custom', path: ['fixedAmount'], message: 'Ingresa un precio válido.' });
    }
    if (values.pricingModel === 'hourly') {
      if (!isPositiveAmount(values.hourlyRateAmount)) {
        ctx.addIssue({ code: 'custom', path: ['hourlyRateAmount'], message: 'Ingresa una tarifa válida.' });
      }
      // Mirrors the backend exactly (@cerca/contract pricingSchema: minimumHours is
      // z.number().int().min(1).max(12)) — same fix as publish-form-schema.ts, done here from
      // the start instead of after a 400 in the field.
      if (!isIntegerInRange(values.minimumHours, 1, 12)) {
        ctx.addIssue({ code: 'custom', path: ['minimumHours'], message: 'Ingresa un número entero de 1 a 12.' });
      }
    }
  });
export type EditListingFormValues = z.infer<typeof editListingFormSchema>;

export { CURRENCY_OPTIONS, PRICING_MODEL_OPTIONS };
