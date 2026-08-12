import { z } from 'zod';
import { moneySchema } from './money';

// Discriminated union, not optional fields: an "hourly" listing without a minimumHours or a
// "quote" listing with a required price are states that must not compile (Cerca.md: "el
// modelo de precio dirige el formulario"). The search card switches on `model` the same way
// the publish form will.
export const pricingSchema = z.discriminatedUnion('model', [
  z.object({ model: z.literal('fixed'), price: moneySchema }),
  z.object({ model: z.literal('hourly'), hourlyRate: moneySchema, minimumHours: z.number().positive() }),
  z.object({ model: z.literal('quote'), startingFrom: moneySchema.optional() }),
]);
export type Pricing = z.infer<typeof pricingSchema>;
