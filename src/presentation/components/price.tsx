import { Text, type StyleProp, type TextStyle } from 'react-native';
import { formatMoney } from '../../domain/models/money';
import type { Money } from '../../domain/models/money';
import { useDeviceLocale } from '../../infrastructure/locale/device-locale';

interface PriceProps {
  money: Money;
  style?: StyleProp<TextStyle>;
  // Only ever set for previewing another locale (see locale-preview.tsx). Real screens
  // never pass this — they take whatever the device is set to.
  localeOverride?: string;
}

// Cerca.md: "el precio en un marketplace es información de primer orden" — this is the one
// place that turns a raw `Money` into the string a user reads, so every screen formats price
// the same way instead of each one calling `formatMoney` by hand.
export function Price({ money, style, localeOverride }: PriceProps) {
  const deviceLocale = useDeviceLocale();
  const locale = localeOverride ?? deviceLocale;

  return (
    <Text style={style} maxFontSizeMultiplier={1.6}>
      {formatMoney(money, locale)}
    </Text>
  );
}
