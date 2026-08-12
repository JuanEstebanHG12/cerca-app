import { z } from 'zod';

export const moneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
});
export type MoneyDto = z.infer<typeof moneySchema>;

export const pricingSchema = z.discriminatedUnion('model', [
  z.object({ model: z.literal('fixed'), price: moneySchema }),
  z.object({ model: z.literal('hourly'), hourlyRate: moneySchema, minimumHours: z.number().int().min(1).max(12) }),
  z.object({ model: z.literal('quote'), startingFrom: moneySchema.optional() }),
]);
export type PricingDto = z.infer<typeof pricingSchema>;

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPointDto = z.infer<typeof geoPointSchema>;
