// The backend only ever sends `distanceMeters` (see GET /listings) — it never decides the
// unit, because the unit is a reader preference, not a fact about the listing. Almost every
// country uses the metric system; the well-known holdouts that read distance in miles are
// the US, Liberia and Myanmar. We only need to recognize those to pick km vs. mi.
const IMPERIAL_REGIONS = new Set(['US', 'LR', 'MM']);
const METERS_PER_MILE = 1609.344;

// A BCP-47 tag ('es-MX', 'en-US', 'de-DE') always has its region as a 2-letter block —
// pulling it with a split avoids depending on the newer `Intl.Locale` API, which isn't
// guaranteed to exist on every Hermes build.
function regionOf(locale: string): string | undefined {
  return locale.split(/[-_]/).find((part) => /^[A-Z]{2}$/.test(part));
}

export function usesImperialDistance(locale: string): boolean {
  const region = regionOf(locale);
  return region !== undefined && IMPERIAL_REGIONS.has(region);
}

// "a 3 km" doesn't get translated word by word — it gets reformatted in miles for an
// imperial locale, unit word included ('unitDisplay: short' → 'km' / 'mi'). Below 10 units
// we keep one decimal (300 m still reads as "0.3 km", not "0 km"); at 10+ whole units are
// precise enough and match how the source app rounds.
export function formatDistance(distanceMeters: number, locale: string): string {
  const imperial = usesImperialDistance(locale);
  const value = imperial ? distanceMeters / METERS_PER_MILE : distanceMeters / 1000;

  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: imperial ? 'mile' : 'kilometer',
    unitDisplay: 'short',
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);
}
