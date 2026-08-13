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
// silently corrupts JPY prices by 100x. COP and CLP have none either — irrelevant for COP
// today only because it happens to share the same 2-digit default as MXN/USD
// (CURRENCY_OPTIONS, publish-form-schema.ts); it stops being irrelevant the moment the
// backend contract adds a zero-decimal currency.
const MINOR_UNIT_DIGITS: Partial<Record<CurrencyCode, number>> = {
  COP: 0,
  CLP: 0,
  JPY: 0,
  KWD: 3,
};

function minorUnitDigits(currency: CurrencyCode): number {
  return MINOR_UNIT_DIGITS[currency] ?? 2;
}

// Currency is a fact about the listing (the provider fixed it); locale is a preference of
// whoever is looking. `undefined` locale defers to the device's own setting.
//
// `currencyDisplay: 'code'` is deliberate, not the `Intl` default ('symbol'): COP, MXN and USD
// — the three currencies this product actually offers (CURRENCY_OPTIONS) — all conventionally
// render with the same bare "$" glyph. Left at the default, `Intl` only disambiguates a
// currency from the viewer's own locale (e.g. "$" in en-US for USD, but "US$" for the same
// amount viewed from es-MX) — which is why the same code showed "COP" in one place and a bare
// "$" in another: it was tracking the viewer's locale, not the currency itself, and COP always
// loses that disambiguation on-device while USD or MXN sometimes doesn't. `'code'` makes it
// show "COP 129.990" / "USD 450.00" / "MXN 1,299.90" everywhere, independent of locale — the
// currency is a fact about the listing and must never depend on who's looking.
export function formatMoney(money: Money, locale?: string): string {
  const digits = minorUnitDigits(money.currency);
  return new Intl.NumberFormat(locale, { style: 'currency', currency: money.currency, currencyDisplay: 'code' }).format(
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

// The inverse of `toMinorUnits`, for the edit form: it starts from a `Money` already fetched
// from the server and needs a plain major-unit number to seed a `TextInput` with — not a
// formatted string with a currency symbol, which is what `formatMoney` is for.
export function fromMinorUnits(money: Money): number {
  const digits = minorUnitDigits(money.currency);
  return money.amountMinor / 10 ** digits;
}
