import { Text, type StyleProp, type TextStyle } from 'react-native';
import { formatDistance } from '../../domain/formatting/distance';
import { useDeviceLocale } from '../../infrastructure/locale/device-locale';

interface DistanceProps {
  meters: number;
  style?: StyleProp<TextStyle>;
  // Only ever set for previewing another locale (see locale-preview.tsx).
  localeOverride?: string;
}

// Same idea as <Price>: one place turns the server's raw `distanceMeters` into "3 km" or
// "1.9 mi" so every screen (search results, listing detail) reads distance the same way.
export function Distance({ meters, style, localeOverride }: DistanceProps) {
  const deviceLocale = useDeviceLocale();
  const locale = localeOverride ?? deviceLocale;

  return (
    <Text style={style} maxFontSizeMultiplier={1.6}>
      {formatDistance(meters, locale)}
    </Text>
  );
}
