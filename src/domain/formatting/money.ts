import { minorUnitsFor, type Money } from '../models/money';

// Currency is a fact about the listing (whoever publishes it fixes it). Locale is a
// preference of whoever is looking. The same MXN 129990 listing renders as "$1,299.90" in
// es-MX, "MX$1,299.90" in en-US, and "1.299,90 MX$" in de-DE — same Money, three strings.
// `Intl.NumberFormat` already knows every currency's symbol placement, thousands separator
// and decimal comma/point per locale, so we never hand-build the string ourselves.
export function formatMoney(money: Money, locale: string): string {
  const digits = minorUnitsFor(money.currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
  }).format(money.amountMinor / 10 ** digits);
}
