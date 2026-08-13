export type CurrencyCode = 'MXN' | 'USD' | 'EUR' | 'JPY' | 'GBP' | 'KWD';

export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

export function minorUnitDigits(currency: CurrencyCode): number {
  switch (currency) {
    case 'JPY':
      return 0;
    case 'KWD':
      return 3;
    case 'MXN':
    case 'USD':
    case 'EUR':
    case 'GBP':
    default:
      return 2;
  }
}

export function formatMoney(m: Money, locale: string): string {
  const digits = minorUnitDigits(m.currency);
  const value = m.amountMinor / 10 ** digits;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function isImperialLocale(locale: string): boolean {
  const normalized = locale.toLowerCase();
  return normalized.includes('en-us') || normalized.includes('en-gb');
}

export function formatDistance(radiusKm: number, locale: string): string {
  if (isImperialLocale(locale)) {
    const miles = radiusKm * 0.621371;
    const formatted = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
    }).format(miles);
    return `${formatted} mi`;
  }

  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(radiusKm);
  return `${formatted} km`;
}
