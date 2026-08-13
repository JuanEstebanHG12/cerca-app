import { useLocales } from 'expo-localization';

// The one spot allowed to know the device locale comes from `expo-localization` — everywhere
// else just takes a `locale: string` (an IETF BCP-47 tag like 'es-MX') as a plain argument,
// same as formatMoney/formatDistance. `useLocales()` re-renders on its own when the user
// changes the OS language mid-session (notably on Android), no AppState polling needed.
export function useDeviceLocale(): string {
  const [locale] = useLocales();
  return locale?.languageTag ?? 'en-US';
}
