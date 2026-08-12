import { z } from 'zod';
import { coordsSchema } from './coords';
import { pricingSchema } from './pricing';

// Mirrors POST /listings' request body exactly (@cerca/contract, createListingSchema).
// `.strict()` on the backend means an extra field the app forgot to strip would be rejected
// outright — this schema is what stops that payload from ever leaving the device.
export const createListingInputSchema = z.object({
  categoryId: z.uuid(),
  title: z.string().min(3, 'Mínimo 3 caracteres.').max(120, 'Máximo 120 caracteres.'),
  description: z.string().min(1, 'Describe tu servicio.').max(4000, 'Máximo 4000 caracteres.'),
  pricing: pricingSchema,
  location: coordsSchema,
});
export type CreateListingInput = z.infer<typeof createListingInputSchema>;
