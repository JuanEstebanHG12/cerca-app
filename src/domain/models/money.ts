import { z } from 'zod';

// Mirrors the backend's moneySchema.currency exactly (@cerca/contract): any 3-letter
// ISO-4217 code, not a fixed whitelist — the seed data alone already uses COP, and hardcoding
// MXN/USD/EUR here is the same "hand-copied contract drifted from reality" bug as the search
// result schema.
export const currencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'currency must be a 3-letter ISO-4217 code');
export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

// Money never travels as a float (Cerca.md: "prohibido un number que represente dinero fuera
// de Money"). amountMinor is always an integer in the currency's smallest unit.
export const moneySchema = z.object({
  amountMinor: z.number().int(),
  currency: currencyCodeSchema,
});
export type Money = z.infer<typeof moneySchema>;

// Most currencies have 2 minor-unit digits, but not all: the yen has none, the Kuwaiti dinar
// has three. Dividing by 100 unconditionally is the bug that looks right for MXN/USD and
// silently corrupts JPY prices by 100x.
const MINOR_UNIT_DIGITS: Partial<Record<CurrencyCode, number>> = {};

function minorUnitDigits(currency: CurrencyCode): number {
  return MINOR_UNIT_DIGITS[currency] ?? 2;
}

// Currency is a fact about the listing (the provider fixed it); locale is a preference of
// whoever is looking. `undefined` locale defers to the device's own setting.
export function formatMoney(money: Money, locale?: string): string {
  const digits = minorUnitDigits(money.currency);
  return new Intl.NumberFormat(locale, { style: 'currency', currency: money.currency }).format(
    money.amountMinor / 10 ** digits,
  );
}

// The inverse of `formatMoney`'s division, for the publish form: a provider types a price in
// major units ("450"), and this is the one place that turns it into the integer minor units
// `Money` requires — same `minorUnitDigits` table, so a currency added here never needs a
// second, inconsistent conversion written elsewhere.
export function toMinorUnits(majorAmount: number, currency: CurrencyCode): number {
  const digits = minorUnitDigits(currency);
  return Math.round(majorAmount * 10 ** digits);
}
