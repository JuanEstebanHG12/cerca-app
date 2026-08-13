import { z } from 'zod';
import { pricingSchema } from './pricing';

// Mirrors PATCH /listings/{id}'s request body exactly (@cerca/contract, updateListingSchema,
// `.strict()`). Every field is optional — the backend only touches what's present, so a caller
// that only wants to rename a listing never has to resend its pricing. Unlike
// createListingInputSchema, there's no `location` or `categoryId`: the backend's update endpoint
// doesn't accept either.
export const updateListingInputSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres.').max(120, 'Máximo 120 caracteres.').optional(),
  description: z.string().min(1, 'Describe tu servicio.').max(4000, 'Máximo 4000 caracteres.').optional(),
  pricing: pricingSchema.optional(),
});
export type UpdateListingInput = z.infer<typeof updateListingInputSchema>;
